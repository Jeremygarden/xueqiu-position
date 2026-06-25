import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getAllPositions,
  savePositions,
  addPosition as storageAdd,
  updatePosition as storageUpdate,
  deletePosition as storageDelete,
  getToken as storageGetToken
} from '@/utils/storage'
import { fetchBatchQuote } from '@/api/xueqiu'
import { detectMarket, detectType } from '@/utils/helpers'

export const usePortfolioStore = defineStore('portfolio', () => {
  const positions = ref([])
  const quotes = ref({})
  const loading = ref(false)
  const lastRefresh = ref(0)
  const viewMode = ref('all')
  const sortBy = ref('default')

  const token = computed(() => storageGetToken())

  const hasToken = computed(() => !!token.value)

  const totalAssets = computed(() => {
    return positions.value.reduce((sum, p) => {
      const quote = quotes.value[p.symbol] || {}
      return sum + (quote.current || 0) * p.shares
    }, 0)
  })

  const totalCost = computed(() => {
    return positions.value.reduce((sum, p) => sum + p.costPrice * p.shares, 0)
  })

  const totalProfit = computed(() => totalAssets.value - totalCost.value)

  const totalProfitPercent = computed(() => {
    if (totalCost.value === 0) return 0
    return (totalProfit.value / totalCost.value) * 100
  })

  const todayProfit = computed(() => {
    return positions.value.reduce((sum, p) => {
      const quote = quotes.value[p.symbol] || {}
      return sum + (quote.change || 0) * p.shares
    }, 0)
  })

  const enrichedPositions = computed(() => {
    return positions.value.map(p => {
      const quote = quotes.value[p.symbol] || {}
      const currentPrice = quote.current || p.costPrice
      const change = quote.change || 0
      const percent = quote.percent || 0
      const marketValue = currentPrice * p.shares
      const cost = p.costPrice * p.shares
      const profit = marketValue - cost
      const profitPercent = cost !== 0 ? (profit / cost) * 100 : 0

      return {
        ...p,
        currentPrice,
        change,
        percent,
        marketValue,
        cost,
        profit,
        profitPercent
      }
    })
  })

  const sortedPositions = computed(() => {
    let list = [...enrichedPositions.value]
    if (sortBy.value === 'profit') {
      list.sort((a, b) => b.profitPercent - a.profitPercent)
    } else if (sortBy.value === 'loss') {
      list.sort((a, b) => a.profitPercent - b.profitPercent)
    } else if (sortBy.value === 'type') {
      list.sort((a, b) => detectType(a.code).localeCompare(detectType(b.code)))
    } else if (sortBy.value === 'market') {
      list.sort((a, b) => detectMarket(a.code).localeCompare(detectMarket(b.code)))
    }
    return list
  })

  const filteredPositions = computed(() => {
    if (viewMode.value === 'all') return sortedPositions.value
    if (viewMode.value === 'stock') {
      return sortedPositions.value.filter(p => detectType(p.code) === '股票')
    }
    if (viewMode.value === 'fund') {
      return sortedPositions.value.filter(p => detectType(p.code) === '基金')
    }
    if (viewMode.value === 'a') {
      return sortedPositions.value.filter(p => detectMarket(p.code) === 'A股')
    }
    if (viewMode.value === 'hk') {
      return sortedPositions.value.filter(p => detectMarket(p.code) === '港股')
    }
    if (viewMode.value === 'us') {
      return sortedPositions.value.filter(p => detectMarket(p.code) === '美股')
    }
    return sortedPositions.value
  })

  function loadPositions() {
    positions.value = getAllPositions()
  }

  function addPosition(position) {
    const result = storageAdd(position)
    if (result) loadPositions()
    return result
  }

  function updatePosition(id, updates) {
    const result = storageUpdate(id, updates)
    if (result) loadPositions()
    return result
  }

  function removePosition(id) {
    const result = storageDelete(id)
    if (result) loadPositions()
    return result
  }

  async function refreshQuotes() {
    if (positions.value.length === 0) return
    loading.value = true
    try {
      const symbols = positions.value.map(p => p.symbol)
      const batchData = await fetchBatchQuote(symbols)
      const quoteMap = {}
      batchData.forEach(q => {
        quoteMap[q.symbol] = q
      })
      quotes.value = quoteMap
      lastRefresh.value = Date.now()
    } catch (err) {
      console.error('Failed to refresh quotes:', err)
    } finally {
      loading.value = false
    }
  }

  function setViewMode(mode) {
    viewMode.value = mode
  }

  function setSortBy(sort) {
    sortBy.value = sort
  }

  return {
    positions,
    quotes,
    loading,
    lastRefresh,
    viewMode,
    sortBy,
    token,
    hasToken,
    totalAssets,
    totalCost,
    totalProfit,
    totalProfitPercent,
    todayProfit,
    enrichedPositions,
    sortedPositions,
    filteredPositions,
    loadPositions,
    addPosition,
    updatePosition,
    removePosition,
    refreshQuotes,
    setViewMode,
    setSortBy
  }
})
