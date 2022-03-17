<template>
  <div :class="{'stck-chart__wrap': true, 'stck-chart__zs': bars.length <= 0 || hasHover == false}">
    <div v-if="bars.length > 0" class="stck-chart">
      <div
        v-for="(b, idx) in bars"
        class="stck-chart__item"
        :style="{ height: b.h, background: b.gradient }"
        @mouseover="itemFocus(b, idx)"
        @mouseout="itemBlur()"
      >
          <i v-for="c in b.childs" :data="c.h" :style="{ height: c.h, background: c.color }"></i>
      </div>
      <aside class="stck-chart__item stck-chart__range">
        <span>${{ range.max }}</span>
        <span>${{ range.mid }}</span>
        <span>${{ range.min }}</span>
      </aside>
    </div>
    <div v-if="!bars.length" class="stck-chart">
      <div v-for="b in zsbars" class="stck-chart__item" :style="{ height: b.h }" />
      <aside class="stck-chart__item stck-chart__range">
        <span>${{ range.max }}</span>
        <span>${{ range.mid }}</span>
        <span>${{ range.min }}</span>
      </aside>
    </div>

    <legend>
      <i v-for="(i, idx) in legend" :class="{active: hoverIdx === idx}">{{ i }}</i>
    </legend>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { DateTime } from 'luxon'
import { getRand, getPercent, toMonetary } from '@/utils/filters.js'
import formatters from '@/utils/formatters.js'

const BASE_GRADIENT = `linear-gradient(180deg, transparent 0%, transparent 100%) !important`

const getBaseLegend = () => {
  const range = []
  // create blank timestamps data to be filled out IF data exists
  for (var i = 0; i < 31; i++) {
    const timestamp = DateTime.fromISO(DateTime.fromMillis(+new Date()).minus({ days: i }).toISODate()).toMillis()
    range.push(`${DateTime.fromMillis(parseInt(timestamp)).toFormat('MMM d')}`)
  }
  return range.reverse()
}

// Fallback Colors
const colors = ['#048243', '#475F94', '#32BF84', '#FDDC5C', '#FA4224']
// NOTE: why is this not using a chart library?
// Because I couldn't find one that generated solid charting allowing for changes between chart styles
export default {
  name: 'StackedBarChart',
  props: ['data', 'hoverFocus', 'hoverBlur'],

  data() {
    return {
      legend: getBaseLegend(),
      range: { min: '0', mid: '500', max: '1k' },
      hoverIdx: null,
      hasHover: true,
    }
  },

  computed: {
    bars() {
      if (!this.data || this.data.length <= 0) return []
      const calcMap = new Map()
      const bounds = { allMax: 0, allMin: 0, range: 0 }

      // Get bounds, for later use in structured bar computation
      this.data.forEach(d => {
        if (bounds.allMax < parseFloat(d.networth)) bounds.allMax = parseFloat(d.networth)
        if (bounds.allMin > parseFloat(d.networth)) bounds.allMin = parseFloat(d.networth)
      })

      if (Math.max(...Object.values(bounds)) !== 0) {
        // get side amount range
        bounds.range = bounds.allMax - bounds.allMin
        this.range.min = toMonetary(bounds.allMin, 0)
        this.range.mid = toMonetary((bounds.allMax + bounds.allMin) / 2, 0)
        this.range.max = toMonetary(bounds.allMax, 0)

        // process all data and format for bar needs
        this.data.forEach(d => {
          const ts = parseInt(d.timestamp)
          const total = parseFloat(d.networth)

          if (total) {
            const h = getPercent(total - bounds.allMin, bounds.range)
            let childs = []

            // ordered for UI consistency
            childs.push({ cr: getPercent(d.crypto - d.interest, total), color: colors[1] })
            childs.push({ cr: getPercent(d.traditional, total), color: colors[2] })
            childs.push({ cr: getPercent(d.interest, total), color: colors[3] })
            childs.push({ cr: getPercent(d.interestPending, total), color: colors[4] })
            childs = childs.map(ch => ({ ...ch,  h: `${Math.round((ch.cr / 4) * 10)}%` })).reverse()

            calcMap.set(`${ts}`, {
              ...d,
              timestamp: ts,
              childs,
              h: `${h}%`,
              gradient: `linear-gradient(180deg, rgba(50,191,132,${Math.max(h/100, 0.2)}) 0%, rgba(50,191,132,0.02) 100%)`,
            })
          } else {
            calcMap.set(`${ts}`, { ...d, h: '0%', gradient: BASE_GRADIENT })
          }
        })
        this.hasHover = true
      } else {
        // Needs Zero State!
        this.hasHover = false
        return this.zsbars
      }

      const allCalc = Array.from(calcMap.values())
      const sorted = allCalc.sort((a, b) => (parseInt(b.timestamp) - parseInt(a.timestamp)))
      const final = sorted.reverse().slice(-31)

      this.legend = [...final].map(f => {
        if (!f.timestamp) return
        return `${DateTime.fromMillis(parseInt(f.timestamp)).toFormat('MMM d')}`
      })

      return final
    },
    zsbars() {
      const calc = []

      for (var i = 0; i < 31; i++) {
        const curr = getRand(30, 100)
        const total = curr + getRand(1, 30)
        const e = Math.round((curr / total) * 100)
        const cols = colors
        const c = Math.floor(Math.random() * cols.length) + 1
        const gradient = cols[c]

        calc.push({
          h: `${e}%`,
          gradient: `linear-gradient(180deg, rgba(50,191,132,0.1) 0%, rgba(50,191,132,0.05) 100%)`,
        })
      }

      return calc
    },
  },

  methods: {
    itemFocus(data, idx) {
      if (this.hasHover === false) return
      this.hoverIdx = idx
      if (typeof this.hoverFocus === 'function') this.hoverFocus(data)
    },
    itemBlur() {
      if (this.hasHover === false) return
      this.hoverIdx = null
      if (typeof this.hoverBlur === 'function') this.hoverBlur()
    },
  },
}
</script>

<style lang="scss" scoped>
.stck-chart {
  display: grid;
  grid-template-columns: repeat(31, 1fr) 45px;
  grid-gap: 12px;
  width: 100%;
  justify-content: flex-end;
  align-content: flex-end;
  align-items: flex-end;
  padding: 0 0 10px 20px;
  height: 30vh;
  min-height: 300px;
  max-height: 400px;

  &__wrap {
    position: relative;
    width: 100%;
  }

  &__item {
    background: linear-gradient(180deg, rgba(50,191,132,1) 0%, rgba(50,191,132,0.02) 100%);
    transition: all 250ms ease-in-out;
    border-radius: 8px 8px 0 0;
    min-height: 8px;
    overflow: hidden;
  }

  &__range {
    background: transparent;
    content: '';
    height: 30vh;
    min-height: 260px;
    max-height: 320px;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    font-style: normal;
    font-size: 8pt;
    font-weight: 300;
    text-transform: uppercase;
    opacity: 0.5;
  }

  &__zs .stck-chart__item {
    background: linear-gradient(180deg, var(--chart-zs-bg) 0%, var(--chart-zs-bg) 100%);
  }
  &__zs .stck-chart__range {
    background: transparent;
  }

  &:hover {
    .stck-chart {
      &__item {
        background: linear-gradient(180deg, rgba(50,191,132,0.3) 0%, rgba(50,191,132,0.2) 100%) !important;

        .stck-chart__zs & {
          background: linear-gradient(180deg, var(--chart-zs-bg) 0%, var(--chart-zs-bg) 100%) !important;
        }
      }

      &__range {
        &,
        .stck-chart__zs & {
          background: transparent !important;
        }
      }
    }

    .stck-chart__item:hover {
      background: transparent !important;
      display: flex;
      flex-direction: column;

      i {
        margin-bottom: 1px;
      }

      i[data='0%'],
      i:last-of-type {
        margin-bottom: 0;
      }

      .stck-chart__zs & {
        background: linear-gradient(180deg, var(--chart-zs-bg) 0%, var(--chart-zs-bg) 100%) !important;
      }

      .stck-chart__range & {
        background: transparent !important;
      }
    }
  }
}

legend {
  display: grid;
  grid-template-columns: repeat(31, 1fr);
  margin: 0 45px 0 20px;
  padding-bottom: 10px;

  i {
    display: block;
    font-style: normal;
    font-size: 6pt;
    font-weight: 300;
    text-transform: uppercase;
    opacity: 0;
    transition: opacity 220ms ease-in-out;

    &:first-child,
    &:last-child,
    &:nth-child(8n) {
      opacity: 0.3;
    }

    &.active {
      opacity: 0.7;
    }
  }
}

@media (max-width: 600px) {
  .stck-chart {
    grid-gap: 4px;

    &__wrap {
      margin-top: -20px;
    }
  }


  legend {
    grid-template-columns: repeat(2, 1fr);

    i {
      display: none;
      &:nth-child(7n) {
        opacity: 0;
      }

      &:first-child {
        display: block;
      }

      &:last-child {
        display: block;
        opacity: 0.3;
        text-align: right;
      }
    }
  }
}
</style>
