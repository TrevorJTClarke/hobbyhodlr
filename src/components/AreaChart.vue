<script>
import { Line } from 'vue-chartjs'
import { toMonetary, displayAsCurrency } from '@/utils/filters.js'

const options = {
  responsive: true,
  maintainAspectRatio: false,
  elements: {
    line: {
      tension: 0.01,
      pointRadius: 0,
    },
    pointRadius: 0,
  },
  animation: {
    animateRotate: false,
    animateScale: false,
  },
  legend: {
    display: false,
    position: 'right',
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
		yAxes: [{
      gridLines: { color: 'rgba(0, 0, 0, 0.05)' },
      ticks: {
        callback: function(value, index, values) {
          return '$' + toMonetary(value)
        }
      }
		}],
	},
}

export default {
  extends: Line,
  props: ['chartData', 'options', 'callback'],
  methods: {
    render() {
      this.renderChart(this.chartData, {
        ...options,
        ...this.options,
        tooltips: {
          // enabled: false,
          mode: 'index',
          intersect: false,
          custom: tooltipModel => {
            if (!tooltipModel.body) {
              if (this.callback) this.callback()
              return
            }
            const bodyLines = tooltipModel.body.map(b => b.lines)
            const point = bodyLines[0] && bodyLines[0][0] ? bodyLines[0][0] : ''
            if (this.callback) this.callback(displayAsCurrency(point, 2))
          }
        },
      })
    },
  },

  mounted () {
    this.render()
  },

  watch: {
    chartData: ['render']
  },
}
</script>

<style>
</style>
