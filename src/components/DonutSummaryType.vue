<template>
  <div>
    <Row v-if="chartData && chartData.datasets">
      <DonutChart :chart-data="chartData" :options="chartOptions" :id="idx" ref="DonutChart" class="chart-wrap" />
    </Row>
    <Row>
      <Tabs size="small" v-model="activeTab" :animated="false" @on-click="changeTab">
        <TabPane name="all" label="All">
          <template v-for="item in allData">
            <AssetItem :data="item.asset" :parent="item" />
          </template>
        </TabPane>
        <TabPane name="crypto" label="Cryptocurrency">
          <template v-for="item in allCrypto">
            <AssetItem :data="item.asset" :parent="item" />
          </template>
        </TabPane>
        <TabPane name="stocks" label="Stocks">
          <template v-for="item in allStocks">
            <AssetItem :data="item.asset" :parent="item" />
          </template>
        </TabPane>
      </Tabs>
    </Row>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { addCommas, toMonetary, displayAsCurrency } from '@/utils/filters.js'
import formatters from '@/utils/formatters.js'
import DonutChart from './DonutChart.vue'
import AssetItem from './AssetItem.vue'

const getFilteredItems = (data, filterFn) => {
  if (!data) return {}
  let items = []

  data.forEach(r => {
    if (filterFn(r.asset)) items.push({
      ...r,
      currentPrice: r.asset.currentPrice,
      asset: {
        ...r.asset,
        totalUnits: r.totalUnits,
        decimals: r.dataType === 'goal' ? 0 : r.asset.decimals,
      }
    })
  })

  items = items
    .filter(i => i.asset.symbol !== undefined && i.totalUnitsUSD !== null)
    .sort((a, b) => (parseFloat(b.totalUnitsUSD) - parseFloat(a.totalUnitsUSD))) // for accounts
    .sort((a, b) => (parseFloat(b.currencyAmount) - parseFloat(a.currencyAmount))) // for goals

  return items
}

export default {
  name: 'DonutSummaryType',
  props: ['data', 'idx'],

  components: {
    AssetItem,
    DonutChart,
  },

  data () {
    return {
      addCommas,
      activeTab: 'all',
      chart: null,
      baseData: [],
    }
  },

  computed: {
    chartData() {
      if (!this.baseData || Object.keys(this.baseData).length <= 0) return []
      const labels = []
      const data = []
      const backgroundColor = []
      const baseData = [...this.baseData]

      const all = baseData.map(i => {
        if (i.totalUnitsUSD) {
          i.currencyAmount = i.totalUnitsUSD
          return i
        }
        const assetItem = i.asset
        const price = assetItem && assetItem.currentPrice ? parseFloat(assetItem.currentPrice) : parseFloat(i.currentPrice)
        const decimals = this.data.dataType === 'account' && i.decimals ? `1e${i.decimals}` : 1
        const units = parseFloat(i.totalUnits) / decimals
        i.currencyAmount = price ? units * price : 0
        return i
      })
      const allSorted = [].concat(all)
        .filter(f => f.currencyAmount)
        .sort((a, b) => (b.currencyAmount - a.currencyAmount))

      allSorted.forEach(d => {
        const color = formatters.getColorFromRaw(d.asset.colors)
        labels.push(d.asset.name)
        backgroundColor.push(color)
        data.push(d.currencyAmount)
      })

      return {
        labels,
        datasets: [{
          backgroundColor,
          borderColor: 'transparent',
          data,
        }],
      }
    },
    chartOptions() {
      return {
        tooltips: {
          callbacks: {
            label: function(tooltipItem, d) {
              const data = displayAsCurrency(d.datasets[tooltipItem.datasetIndex].data[tooltipItem.index] || '')
              const label = d.labels[tooltipItem.index]
              return `${label}: ${data}`
            }
          }
        }
      }
    },
    allData() {
      const baseData = [...this.data]
      const items = getFilteredItems(baseData, asset => {
        const price = asset && asset.currentPrice ? parseFloat(asset.currentPrice) : 0
        return (price !== undefined)
      })

      return items
    },
    allStocks() {
      const baseData = [...this.data]
      const items = getFilteredItems(baseData, asset => {
        const price = asset && asset.currentPrice ? parseFloat(asset.currentPrice) : 0
        return (price !== undefined && asset.type === 'security')
      })

      return items
    },
    allCrypto() {
      const baseData = [...this.data]
      const items = getFilteredItems(baseData, asset => {
        const price = asset && asset.currentPrice ? parseFloat(asset.currentPrice) : 0
        return (price !== undefined && asset.type === 'cryptocurrency')
      })

      return items
    },
  },

  methods: {
    changeTab(name) {
      switch (name) {
        case 'crypto':
            this.baseData = [...this.allCrypto]
          break;
        case 'stocks':
            this.baseData = [...this.allStocks]
          break;
        default:
          this.baseData = [...this.allData]
      }
    },
  },

  mounted() {
    if (this.allData) this.baseData = [...this.allData]
  }
}
</script>

<style>
.inner-chart {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
}

.inner-chart .ivu-chart-circle {
  margin: auto;
}

@media (max-width: 800px) {
  .inner-chart .ivu-chart-circle {
    transform: scale(0.75);
  }
}
</style>
