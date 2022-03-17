<template>
  <div class="arb-chart">
    <Row style="padding: 0 0 10px">
      <Col span="12" style="padding: 0 10px 0 0">
        <h2>Asset Swap Ratio</h2>
      </Col>
      <Col span="6" style="padding: 0 10px 0 0">
        <Select v-model="unitArbA" filterable v-on:on-change="setUnitArb('a')" style="width: 100%">
          <Option v-for="a in allSymbols" :key="a" :value="a">{{ a }}</Option>
        </Select>
      </Col>
      <Col span="6">
        <Select v-model="unitArbB" filterable v-on:on-change="setUnitArb('b')" style="width: 100%">
          <Option v-for="a in allSymbols" :key="a" :value="a">{{ a }}</Option>
        </Select>
      </Col>
    </Row>

    <div v-if="$apollo.queries.unitarb.loading">
      <h3>Loading...</h3>
    </div>
    <AreaChart v-else :chart-data="chartData" :options="chartOptions" id="2" ref="ArbAreaChart" class="chart-wrap" />
  </div>
</template>

<script>
import gql from 'graphql-tag'
import { mapGetters, mapActions } from 'vuex'
import { GetUnitArb } from '../gql/research'
// import brandColors from '../../static/brandColors.json'
import AreaChart from '@/components/AreaChart.vue'

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
  name: 'UnitArbChart',

  data() {
    return {
      unitArbA: 'BTC',
      unitArbB: 'ETH',
      loading: false,
    }
  },

  components: {
    AreaChart,
  },

  apollo: {
    unitarb: {
      query: gql`${GetUnitArb}`,
      result ({ data }) {
        if (!data || !data.unitarb) return {}
        return data.unitarb
      },
      variables: {
        assetA: this.unitArbA || 'btc',
        assetB: this.unitArbB || 'eth',
      },
    },
  },

  computed: {
    ...mapGetters(['assets']),
    allSymbols() {
      if (!this.assets) return []
      return Object.keys(this.assets).map(a => a.toUpperCase()).sort()
    },
    chartData() {
      if (!this.unitArbA || !this.unitArbB) return
      const datasets = []
      let borderColor, title

      // // find the matching asset, set its brand:
      // brandColors.forEach(b => {
      //   if (b.symbol === this.unitArbB.toLowerCase()) {
      //     title = b.name
      //     borderColor = b.colors[0]
      //   }
      // })

      return {
        datasets: [{
          // label: title,
          borderColor,
          backgroundColor: borderColor,
          data: this.unitarb,
          pointRadius: 0,
          fill: false,
        }],
      }
    },
    chartOptions() {
      const a = { ...baseChartOptions }

      a.legend = { display: false }
      a.scales.yAxes = [{
        gridLines: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: {
          callback: function(value, index, values) {
            return value
          }
        }
      }]

      return a
    },
  },

  methods: {
    setUnitArb(type) {
      if (!type) return
      const params = {
        assetA: this.unitArbA,
        assetB: this.unitArbB,
      }

      params[`asset${type.toUpperCase()}`] = this[`unitArb${type.toUpperCase()}`]
      this.$apollo.queries.unitarb.refetch(params)
    },
  },
}
</script>

<style>
.arb-chart .chart-wrap {
  height: 30vh;
  max-height: 258px;
  min-height: 158px;
}
</style>
