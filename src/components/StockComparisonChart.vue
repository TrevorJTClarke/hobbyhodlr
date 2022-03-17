<template>
  <div class="stock-chart">
    <Row style="padding: 0 0 20px">
      <Col span="12" style="padding: 0 10px 0 0">
        <h2>Performance</h2>
      </Col>
      <Col span="12" style="display: flex; justify-content: space-between;">
        <h2>Traditional VS</h2>
        <Select v-model="compareAsset" filterable v-on:on-change="setCompareAsset" style="width: 40%">
          <Option v-for="a in allSymbols" :key="a" :value="a">{{ a }}</Option>
        </Select>
      </Col>
    </Row>

    <div v-if="$apollo.queries.corecomparison.loading">
      <h3>Loading...</h3>
    </div>
    <AreaChart v-else :chart-data="chartData" :options="chartOptions" id="1" ref="AreaChart" class="chart-wrap" />
  </div>
</template>

<script>
import gql from 'graphql-tag'
import { mapGetters, mapActions } from 'vuex'
import { GetCoreComparison } from '../gql/research'
// import brandColors from '../../static/brandColors.json'
import AreaChart from '@/components/AreaChart.vue'

const formatting = {
  xau: { title: 'Gold', borderColor: 'rgb(235, 215, 41)' },
  spy: { title: 'S&P 500', borderColor: 'rgb(41, 84, 235)' },
  asset: { title: 'Bitcoin', borderColor: '#f4941c' },
}

const baseChartOptions = {
  maintainAspectRatio: false,
  height: 250,
  legend: {},
  tooltip: {
    intersect: false,
  },
  line: {
    pointRadius: 0,
    pointBorderWidth: 0,
  },
  scales: {
    xAxes: [{
      gridLines: { display: false },
      type: 'time',
      distribution: 'series',
      ticks: {
        source: 'data',
        callback: function(dataLabel, index) {
          // Hide the label of every 2nd dataset. return null to hide the grid line too
          return index % 5 === 0 ? dataLabel : ''
        }
      },
    }],
  },
}

export default {
  name: 'StockComparisonChart',

  data() {
    return {
      compareAsset: 'BTC',
      loading: false,
    }
  },

  components: {
    AreaChart,
  },

  apollo: {
    corecomparison: {
      query: gql`${GetCoreComparison}`,
      result ({ data }) {
        if (!data || !data.corecomparison) return {}
        return data.corecomparison
      },
      variables: {
        asset: this.compareAsset || 'btc',
      },
    },
  },

  computed: {
    ...mapGetters(['assets']),
    allSymbols() {
      if (!this.assets) return []
      return Object.keys(this.assets).map(a => a.toUpperCase()).sort()
    },
    chartOptions() {
      const o = { ...baseChartOptions }

      o.scales.yAxes = [{
        gridLines: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: {
          callback: function(value, index, values) {
            return `${value}%`
          }
        }
      }]

      return o
    },
    chartData() {
      if (!this.corecomparison || !this.corecomparison.asset) return
      const datasets = []

      // // find the matching asset, set its brand:
      // brandColors.forEach(b => {
      //   if (b.symbol === this.compareAsset.toLowerCase()) {
      //     formatting.asset.title = b.name
      //     formatting.asset.borderColor = b.colors[0]
      //   }
      // })

      Object.keys(this.corecomparison).forEach(a => {
        if (formatting[a]) datasets.push({
          label: formatting[a].title,
          borderColor: formatting[a].borderColor,
          backgroundColor: formatting[a].borderColor,
          data: this.corecomparison[a],
          pointRadius: 0,
          fill: false,
        })
      })

      return {
        datasets,
      }
    },
  },

  methods: {
    setCompareAsset() {
      if (!this.compareAsset) return
      this.$apollo.queries.corecomparison.refetch({
        asset: this.compareAsset || 'btc',
      })
    },
  },
}
</script>

<style>
.stock-chart .chart-wrap {
  height: 30vh;
  max-height: 300px;
  min-height: 200px;
}
</style>
