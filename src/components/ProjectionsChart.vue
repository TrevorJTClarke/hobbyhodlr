<template>
  <div class="projections-chart">
    <div v-if="!series.length">
      <h3>Loading...</h3>
    </div>
    <AreaChart v-else :chart-data="chartData" :options="chartOptions" id="2" ref="ArbAreaChart" class="chart-wrap" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
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
  name: 'ProjectionChart',
  props: ['series', 'seriesMin', 'seriesMax'],

  data() {
    return {
    }
  },

  components: {
    AreaChart,
  },

  computed: {
    ...mapGetters(['assets']),
    allSymbols() {
      if (!this.assets) return []
      return Object.keys(this.assets).map(a => a.toUpperCase()).sort()
    },
    chartData() {
      if (!this.series || !this.series.length) return
      const datasets = []
      let gradient = 'rgba(0,0,0,0.1)'

      const el = document.getElementById('line-chart')
      const ctx = el ? el.getContext('2d') : null
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400)
        gradient.addColorStop(0, 'rgba(0,0,0,0.4)')
        gradient.addColorStop(1, 'rgba(0,0,0,0)')
      }

      if (this.seriesMin) datasets.push({
        title: 'Min',
        backgroundColor: 'transparent',
        borderColor: `red`,
        borderWidth: 1,
        data: this.seriesMin,
        pointRadius: 0,
        fill: true,
      })

      if (this.series) datasets.push({
        borderColor: '#999',
        backgroundColor: gradient,
        borderWidth: 1,
        data: this.series,
        pointRadius: 0,
        fill: true,
      })

      if (this.seriesMax) datasets.push({
        title: 'Max',
        backgroundColor: 'transparent',
        borderColor: `green`,
        borderWidth: 1,
        data: this.seriesMax,
        pointRadius: 0,
        fill: true,
      })

      return {
        datasets,
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
}
</script>

<style>
.projections-chart .chart-wrap {
  height: 30vh;
  max-height: 350px;
  min-height: 200px;
}
</style>
