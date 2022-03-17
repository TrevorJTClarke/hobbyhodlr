<template>
  <div :class="{'chart-wrap': true, 'hover-chart': hoverActive }">
    <div class="stats-items">
      <div class="stat stat-large">
        <h1 v-if="!activeAccount.totals || !activeAccount.totals.networth" class="zs zs-h1">&nbsp;</h1>
        <h1 v-if="activeAccount.totals && activeAccount.totals.networth">{{ displayAsCurrency(activeAccount.totals.networth) }}</h1>
        <h5>
          <span>Net Worth</span>
          <Tooltip placement="bottom" :transfer="true" max-width="250" content="This amount is the sum total of all account holdings. All summations use base currency (I.E. USD) to total consistently.">
            <Icon type="md-information-circle" size="18" />
          </Tooltip>
        </h5>
      </div>

      <div class="flex-stats">
        <div class="stat cl-blue">
          <h3 v-if="!activeAccount.totals || !activeAccount.totals.crypto" class="zs zs-h3">&nbsp;</h3>
          <h3 v-if="activeAccount.totals && activeAccount.totals.crypto">${{ toMonetary(activeAccount.totals.crypto, 2) }}</h3>
          <h5>
            <span>Cryptocurrency</span>
          </h5>
        </div>
        <div class="stat cl-green">
          <h3 v-if="!activeAccount.totals || !activeAccount.totals.traditional" class="zs zs-h3">&nbsp;</h3>
          <h3 v-if="activeAccount.totals && activeAccount.totals.traditional">${{ toMonetary(activeAccount.totals.traditional, 2) }}</h3>
          <h5>
            <span>Stocks</span>
          </h5>
        </div>
        <div class="stat cl-yellow">
          <h3 v-if="!activeAccount.totals || !activeAccount.totals.interest" class="zs zs-h3">&nbsp;</h3>
          <h3 v-if="activeAccount.totals && activeAccount.totals.interest">${{ toMonetary(activeAccount.totals.interest, 2) }}</h3>
          <h5>
            <span>Staked Balance</span>
            <Tooltip placement="bottom" :transfer="true" max-width="250" content="This amount is the sum total of all staked balances. If a cryptocurrency uses Proof of Stake or similar, the stake balance will be the total assets committed to uphold the network, in return for validation rewards. All summations use base currency (I.E. USD) to total consistently.">
              <Icon type="md-information-circle" size="18" />
            </Tooltip>
          </h5>
        </div>
        <div class="stat cl-red">
          <h3 v-if="!activeAccount.totals || !activeAccount.totals.interestPending" class="zs zs-h3">&nbsp;</h3>
          <h3 v-if="activeAccount.totals && activeAccount.totals.interestPending">${{ toMonetary(activeAccount.totals.interestPending, 2) }}</h3>
          <h5>
            <span>Pending Rewards</span>
            <Tooltip placement="left" :transfer="true" max-width="250" content="This amount is the sum total of all unclaimed staking rewards. If a cryptocurrency uses Proof of Stake or similar, the pending reward balance will be the total unclaimed assets earned from validation of the network. All summations use base currency (I.E. USD) to total consistently.">
              <Icon type="md-information-circle" size="18" />
            </Tooltip>
          </h5>
        </div>
      </div>
    </div>
    <StackedBarChart :data="series" :hover-focus="handleFocus" :hover-blur="handleBlur" />
  </div>
</template>

<script>
import gql from 'graphql-tag'
import { mapGetters } from 'vuex'
import { displayAsCurrency, toMonetary } from '@/utils/filters'
import { GetHoldingSeries } from '@/gql/account'
import { GetUser, UpdateUserTotals } from '@/gql/user'
import StackedBarChart from '@/components/StackedBarChart.vue'

export default {
  name: 'AccountSeries',

  components: {
    StackedBarChart,
  },

  data() {
    return {
      account: {},
      activeAccount: {},
      combinedChartActive: true,
      toMonetary,
      displayAsCurrency,
      hoverActive: false,
    }
  },

  apollo: {
    user: {
      query: gql`${GetUser}`,
      variables() {
        return {
          id: this.user._id,
        }
      },
      result({ data }) {
        if (!data || !data.user) return {}
        this.account = data.user
        this.activeAccount = { ...data.user }
        return data.user
      },
    },
    holdingsSeries: {
      query: gql`${GetHoldingSeries}`,
      variables() { return { userId: this.user._id } },
    },
    $subscribe: {
      updateUserTotals: {
        query: gql`${UpdateUserTotals}`,
        variables () {},
        result ({ data }) {
          this.activeAccount = {
            totals: { ...data.updateUserTotals }
          }
        },
      },
    },
  },

  computed: {
    ...mapGetters(['user']),
    series() {
      if (!this.holdingsSeries || !this.holdingsSeries.length) return []
      // Overrides data when realtime updates occur for last bar totals
      const l = this.holdingsSeries.length - 1
      this.holdingsSeries[l] = {
        ...this.holdingsSeries[l],
        ...this.activeAccount.totals,
      }
      return this.holdingsSeries
    },
  },

  methods: {
    handleFocus(data) {
      this.hoverActive = true
      this.activeAccount = { totals: { ...data } }
    },
    handleBlur() {
      this.activeAccount = { ...this.account }
      this.hoverActive = false
    },
  },
}
</script>

<style scoped>
.chart-wrap {
  position: relative;
}
.stats-items {
  display: flex;
  margin: 0 30px 10px;
}
.flex-stats {
  display: grid;
  justify-content: space-between;
  grid-template-columns: repeat(auto-fill, 25%);
  width: 60%;
}
.stat.stat-large {
  width: 40%;
}

.stat.stat-large h1 {
  font-size: 42pt;
  font-weight: 100;
}
.stat.stat-large h5 {
  font-size: 12pt;
  font-weight: 100;
  margin: 0;
}

.stat {
  margin: auto 0;
  position: relative;
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

.stat::after {
  position: absolute;
  content: '';
  top: 14px;
  left: -26px;
  height: 16px;
  width: 16px;
  border: 5px solid grey;
  border-radius: 100%;
  opacity: 0;
  transition: opacity 220ms ease-in-out;
}

.stat.stat-large::after { display: none; }

.stat.cl-red::after { border-color: #FA4224; }
.stat.cl-yellow::after { border-color: #FDDC5C; }
.stat.cl-green::after { border-color: #32BF84; }
.stat.cl-blue::after { border-color: #475F94; }

.chart-card {
  padding: 32px 0 0px;
}

.zs {
  background: var(--chart-zs-bg);
  border-radius: 80px;
}
.zs.zs-h3 {
  width: 80%;
  min-width: 120px;
}
.zs.zs-h1 {
  width: 60%;
  min-width: 220px;
}

.hover-chart .stat::after {
  opacity: 1;
}

@media (max-width: 800px) {
  .chart-card {
    padding: 20px 0 0px;
  }
  .flex-stats {
    grid-template-columns: repeat(auto-fill, 50%);
    width: 100%;
  }
  .stats-items {
    justify-content: space-between;
    flex-wrap: wrap;
    margin: 0 20px 10px;
  }
  .stat::after,
  .stat .ivu-tooltip {
    display: none;
  }

  .stat.stat-large {
    width: 100%;
  }

  .stat.stat-large h1 {
    font-size: 28pt;
  }
  .stat.stat-large h5 {
    font-size: 10pt;
    margin-bottom: 20px;
  }

  .stat h3 {
    font-size: 14pt;
    line-height: 24pt;
  }
  .stat h5 {
    font-size: 8pt;
  }
}
</style>
