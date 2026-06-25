/**
 * src/stores/portfolio.js — round-1 placeholder
 * Full implementation: round 4.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as storage from '@/utils/storage.js'

export const usePortfolioStore = defineStore('portfolio', () => {
  const positions = ref([])
  const loading = ref(false)
  const lastRefresh = ref(null)
  const sortBy = ref('default')
  const filterType = ref('all')

  function loadPositions() {
    positions.value = storage.getPositions()
  }
  async function refreshPrices() { /* round 4 */ }
  async function addPosition(pos) {
    storage.addPosition(pos)
    loadPositions()
  }
  async function removePosition(symbol) {
    storage.removePosition(symbol)
    loadPositions()
  }
  async function refreshSignals() { /* round 4 */ }

  const filteredPositions = computed(() => positions.value)
  const totalCost = computed(() =>
    positions.value.reduce((s, p) => s + (Number(p.shares) || 0) * (Number(p.costPrice) || 0), 0)
  )
  const totalValue = computed(() =>
    positions.value.reduce((s, p) => s + (Number(p.shares) || 0) * (Number(p.currentPrice ?? p.costPrice) || 0), 0)
  )
  const totalProfit = computed(() => totalValue.value - totalCost.value)
  const totalProfitRate = computed(() => totalCost.value === 0 ? 0 : (totalProfit.value / totalCost.value) * 100)
  const todayProfit = computed(() => 0)
  const positionsByType = computed(() => ({}))
  const positionsByMarket = computed(() => ({}))

  return {
    positions, loading, lastRefresh, sortBy, filterType,
    loadPositions, refreshPrices, addPosition, removePosition, refreshSignals,
    filteredPositions, totalCost, totalValue, totalProfit, totalProfitRate,
    todayProfit, positionsByType, positionsByMarket
  }
})
