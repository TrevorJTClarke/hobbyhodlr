<template>
  <div>
    <div class="stats-items">
      <div class="stat">
        <h3 v-if="!combined.goalTotalValue" class="zs zs-h3">&nbsp;</h3>
        <h3 v-if="combined.goalTotalValue"><span>{{ displayAsCurrency(combined.goalTotalValue) }}</span> <small v-if="combined.goalPercentComplete" class="chip">{{ combined.goalPercentComplete }}% Complete</small></h3>
        <h5>
          <span>Goal Total</span>
          <Tooltip max-width="250" content="This amount is the sum total of all goals compared with account holdings. All summations use base currency (I.E. USD) to total consistently.">
            <Icon type="md-information-circle" size="18" />
          </Tooltip>
        </h5>
      </div>
    </div>

    <MultiProgressBarChart :data="combined.assetsGoals" />

    <div v-if="$apollo.queries.holdings && $apollo.queries.holdings.loading" class="list-blank">
      <Spin size="large" fix></Spin>
    </div>
  </div>
</template>

<script>
import gql from 'graphql-tag'
import { mapGetters } from 'vuex'
import { toMonetary, displayAsCurrency } from '@/utils/filters'
import formatters from '@/utils/formatters.js'
import { GetHoldings } from '../gql/account'
import { GetGoals } from '../gql/goal'
import MultiProgressBarChart from '@/components/MultiProgressBarChart.vue'

const getCombinedGoalAccounts = (holdings, goals) => {
  const data = {
    goalCurrentValue: 0,
    goalTotalValue: 0,
    goalPercentComplete: 0,
    assetsGoals: [],
  }
  if (!goals || goals.length <= 0) return data

  // map goals to map for easier use
  goals.forEach(g => {
    const name = g.asset && g.asset.name ? g.asset.name : ''
    const symbol = g.asset && g.asset.symbol ? g.asset.symbol : ''
    const currentPrice = g.asset && g.asset.currentPrice ? parseFloat(g.asset.currentPrice) : 0
    const total = g.currencyAmount ? parseFloat(g.currencyAmount) : 0
    const color = g.asset && g.asset.colors ? formatters.getColorFromRaw(g.asset.colors) : null
    const cItem = { currentPrice, total, color, name, symbol: symbol.toUpperCase(), }

    if (g.currencyAmount) data.goalTotalValue += parseFloat(g.currencyAmount)

    // map goals and holdings into one nice package, IF matching holding to goal
    holdings.forEach(h => {
      if (g.asset.symbol.toLowerCase() === h.asset.symbol.toLowerCase()) {
        cItem.current = parseFloat(h.totalUnitsUSD) || 0
        data.goalCurrentValue += parseFloat(h.totalUnitsUSD) > parseFloat(g.currencyAmount) ? parseFloat(g.currencyAmount) : parseFloat(h.totalUnitsUSD)
      }
    })

    data.assetsGoals.push(cItem)
  })

  // Calculate percent complete
  data.goalPercentComplete = Math.round((data.goalCurrentValue / data.goalTotalValue) * 100) > 100 ? 100 : Math.round((data.goalCurrentValue / data.goalTotalValue) * 100)

  return data
}

export default {
  name: 'GoalsOverview',

  components: {
    MultiProgressBarChart,
  },

  data() {
    return {
      displayAsCurrency,
    }
  },

  apollo: {
    holdings: {
      query: gql`${GetHoldings}`,
      variables() {
        return {
          userId: this.user._id,
        }
      },
    },
    goals: {
      query: gql`${GetGoals}`,
      variables() {
        return {
          userId: this.user._id,
        }
      },
    },
  },

  computed: {
    ...mapGetters(['user']),
    combined() {
      if (this.holdings && this.holdings.length > 0 && this.goals && this.goals.length > 0)
        return getCombinedGoalAccounts(this.holdings, this.goals)

      return {
        goalCurrentValue: 0,
        goalTotalValue: 0,
        goalPercentComplete: 0,
        assetsGoals: [],
      }
    },
  },
}
</script>


<style scoped>
.stats-items {
  display: flex;
  margin: 20px 15px 10px;
}
.mr-50 {
  margin-right: 50px;
}
.stat h3 {
  font-size: 24pt;
  vertical-align: top;
  line-height: 32pt;
  display: inline-flex;
  font-weight: 400;
}
.stat h5 {
  font-size: 10pt;
  text-transform: uppercase;
  margin: 4px 0 20px;
}
.stat h5 span,
.stat h5 .ivu-icon {
  opacity: 0.5;
}
.stat h5 .ivu-icon {
  margin-left: 7px;
}
.chip {
  background: #515a6e;
  color: white;
  font-size: 7pt;
  font-weight: 600;
  text-transform: uppercase;
  padding: 0 8px;
  border-radius: 40px;
  display: inline-flex;
  vertical-align: top;
  margin: auto 10px;
  line-height: 20pt;
  opacity: 0.6;
}

.chart-card {
  padding: 32px 0 0px;
}

.zs {
  background: rgba(12, 181, 119,0.1);
  border-radius: 80px;
}
.zs.zs-h3 {
  width: 100%;
  min-width: 120px;
}

@media (max-width: 800px) {
  .stats-items {
    margin: 0 0 0;
  }
}
</style>
