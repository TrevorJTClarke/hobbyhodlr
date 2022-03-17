<script>
import { Doughnut, mixins } from 'vue-chartjs'

const options = {
  responsive: true,
  maintainAspectRatio: false,
  cutoutPercentage: 70,
  animation: {
    animateRotate: false,
    animateScale: false,
  },
  legend: { display: false },
}

export default {
  extends: Doughnut,
  mixins: [mixins.reactiveProp],
  props: ['chartData', 'options'],
  mounted () {
    const opts = { ...options, ...this.options }
    this.renderChart(this.chartData, opts)
  }
}
</script>

<style>
</style>
