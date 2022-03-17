<template>
  <div class="progress-wrap">
    <div v-if="progress.length > 0" class="progress">
      <div v-for="(i, idx) in progress" class="progress-item" :style="{ width: i.w, background: i.color }" :title="`${i.name} ${i.d}% Complete, $${toMonetary(i.current, 2)}`" />
    </div>
    <div v-if="!progress.length" class="progress">
      <div v-for="(i, idx) in zsprogress" class="progress-item" :style="{ width: i.w, background: i.color, opacity: '0.3' }" :title="`${i.name} ${i.d}% Complete`" />
    </div>
    <div v-if="progress.length > 0" class="tags">
      <div v-for="(i, idx) in progress" class="tag" :title="`${i.name} ${i.d}% Complete, $${toMonetary(i.current, 2)}`">
        <i-circle :size="18" :trail-width="30" :stroke-width="30" :percent="i.d" :stroke-color="i.color" trail-color="var(--bg-secondary)" />
        <span>{{ i.symbol }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getRand, toMonetary } from '@/utils/filters.js'
import formatters from '@/utils/formatters.js'
// Fallback Colors
const colors = ['#048243', '#32BF84', '#CAFFFB', '#475F94', '#FDDC5C', '#FA4224']
const zsColors = ['#eeeeec', '#f1f1e9', '#f1f1e5', '#e4e4d8', '#fbfbf4', '#f0f0f0']
// NOTE: why is this not using a chart library?
// Because I couldn't find one that I could do the overlays or multiple current/totals in single large bar.
// Example Data:
// const data = [
//   {
//     current: 48.32,
//     currentPrice: 0.32,
//     total: 98.45,
//     color: '#4c598c',
//     name: 'Polkadot',
//     symbol: 'DOT'
//   },
// ]
export default {
  name: 'MultiProgressBarChart',
  props: ['data'],

  computed: {
    progress() {
      if (!this.data || this.data.length <= 0) return []
      const calc = []
      const totalItems = this.data.length
      let goalTotalAmount = 0

      // Total all goals amounts
      this.data.forEach(d => {
        if (d.total) goalTotalAmount += d.total || 0
      })

      // Return all percentages
      this.data.forEach(d => {
        let amt = d.current > d.total ? d.total : d.current
        if (!d.current) amt = 0
        const i = Math.round((amt / goalTotalAmount) * 100)
        const p = d.current ? Math.round((d.current / d.total) * 100) > 100 ? 100 : Math.round((d.current / d.total) * 100) : 0
        const color = d.color || this.getFallbackColor(d)

        calc.push({
          ...d,
          w: `${i}%` !== '0%' ? `${i}%` : '0.1%',
          p: `${p}%`,
          d: p,
          f: i,
          color,
        })
      })

      return calc.sort((a, b) => (b.f - a.f))
    },
    zsprogress() {
      const calc = []

      for (var i = 0; i < zsColors.length; i++) {
        const curr = getRand(30, 100)
        const total = curr + getRand(1, 30)
        const i = Math.round((curr / total) * 100)
        const p = Math.round((curr / total) * 100) > 100 ? 100 : Math.round((curr / total) * 100)
        const color = this.getFallbackColor(null, true)

        calc.push({
          name: '',
          w: `${i}%`,
          p: `${p}%`,
          d: p,
          f: i,
          color,
        })
      }

      return calc.sort((a, b) => (b.f - a.f))
    },
  },

  methods: {
    toMonetary,
    getFallbackColor(item, isZs) {
      // if we have the asset color, use it
      if (item && item.asset && item.asset.colors) {
        return formatters.getColorFromRaw(d.asset.colors)
      }
      const cols = isZs ? zsColors : colors

      const i = Math.floor(Math.random() * cols.length) + 1
      return cols[i]
    },
  },
}
</script>

<style lang="scss" scoped>
$height: 30px;

.progress-wrap {
  position: relative;
  margin: 0 15px 20px;
}

.progress {
  border-radius: 20px;
  background: transparentize(#ccc, 0.9);
  box-shadow: inset 0 -1px 5px rgba(0, 0, 0, 0.05);
  display: flex;
  position: relative;
  height: $height;
  width: 100%;
  overflow: hidden;

  &:after {
    content: '';
    background: white;
    border-radius: 8px;
    position: absolute;
    height: 5px;
    opacity: 0.2;
    top: 4px;
    right: 12px;
    left: 12px;
  }

  .progress-item {
    background: #eeeeec;
    height: $height;
    transition: all 250ms ease;
  }
}

.tag {
  color: var(--body-color);
  display: inline-flex;
  font-size: 8pt;
  font-weight: 500;
  margin: 12px 7px 0 0;
  vertical-align: top;
  overflow: hidden;
  text-transform: uppercase;

  span {
    display: inline-block;
    padding: 1px 5px 0;
    font-weight: 600;
  }
}

@media (max-width: 800px) {
  .progress-wrap {
    margin: 0 0 10px;
  }
}
</style>
