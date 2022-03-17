<template>
  <div>
    <Row>
      <Col span="24">
        <Card shadow>
          <Row style="padding: 0 0 10px">
            <Col span="12" style="padding: 0 10px 0 0">
              <h2>Earnings & Projections</h2>
            </Col>
          </Row>

          <Row>
            <Col span="8" class="responsive-card">
              <Tabs size="small" :animated="false">
                <TabPane label="Account">
                  <div class="select-custom">
                    <div class="selected-item" @click.prevent="toggleTypeItems('account')">
                      <AssetItem v-if="activeItems.account" :data="activeItems.account" />
                      <Icon v-if="!toggles.account" type="ios-arrow-down" />
                      <Icon v-if="toggles.account" type="ios-arrow-up" />
                    </div>
                    <div :class="{'select-items':true, active: toggles.account}">
                      <div class="select-item" v-for="s in allAccounts" @click.prevent="chooseTypeItem('account', s)">
                        <AssetItem v-if="s" :data="s" />
                      </div>
                    </div>
                  </div>

                  <Row>
                    <Col span="12" style="padding-right: 10px">
                      <h5>Rate (APY)</h5>
                      <Input v-model="annualRate" placeholder="Example: 3.8" />
                    </Col>
                    <Col span="12">
                      <h5>Variance</h5>
                      <Input v-model="spread" placeholder="Example: 1.4" />
                    </Col>
                  </Row>
                  <h5>Years</h5>
                  <Input v-model="years" placeholder="Example: 1" />
                </TabPane>
                <TabPane label="Staking Rewards">
                  <div class="select-custom">
                    <div class="selected-item" @click.prevent="toggleTypeItems('stake')">
                      <InterestItem v-if="activeItems.stake" :data="activeItems.stake" is-small="true" />
                      <Icon v-if="!toggles.stake" type="ios-arrow-down" />
                      <Icon v-if="toggles.stake" type="ios-arrow-up" />
                    </div>
                    <div :class="{'select-items':true, active: toggles.stake}">
                      <div class="select-item" v-for="a in allStakingSymbols" @click.prevent="chooseTypeItem('stake', a)">
                        <InterestItem v-if="a" :data="a" is-small="true" />
                      </div>
                    </div>
                  </div>

                  <h5>Starting Balance</h5>
                  <Input v-model="initialAmount" placeholder="Example: 8732.09" />
                  <h5>Years</h5>
                  <Input v-model="years" placeholder="Example: 1" />
                </TabPane>
                <TabPane label="Loan Interest">
                  <div class="select-custom">
                    <div class="selected-item" @click.prevent="toggleTypeItems('loan')">
                      <InterestItem v-if="activeItems.loan" :data="activeItems.loan" is-small="true" />
                      <Icon v-if="!toggles.loan" type="ios-arrow-down" />
                      <Icon v-if="toggles.loan" type="ios-arrow-up" />
                    </div>
                    <div :class="{'select-items':true, active: toggles.loan}">
                      <div class="select-item" v-for="l in allLoanSymbols" @click.prevent="chooseTypeItem('loan', l)">
                        <InterestItem v-if="l" :data="l" is-small="true" />
                      </div>
                    </div>
                  </div>

                  <h5>Starting Balance</h5>
                  <Input v-model="initialAmount" placeholder="Example: 8732.09" />
                  <h5>Years</h5>
                  <Input v-model="years" placeholder="Example: 1" />
                </TabPane>
                <TabPane label="Custom">
                  <h5>Starting Balance</h5>
                  <Input v-model="initialAmount" placeholder="Example: 8732.09" />
                  <Row>
                    <Col span="12" style="padding-right: 10px">
                      <h5>Rate (APY)</h5>
                      <Input v-model="annualRate" placeholder="Example: 3.8" />
                    </Col>
                    <Col span="12">
                      <h5>Variance</h5>
                      <Input v-model="spread" placeholder="Example: 1.4" />
                    </Col>
                  </Row>
                  <h5>Years</h5>
                  <Input v-model="years" placeholder="Example: 1" />
                </TabPane>
              </Tabs>
            </Col>

            <Col span="16" class="responsive-card">
              <div class="compound-outcome" v-if="compound">
                <div class="stats-items" v-if="compound.finalAmount">
                  <div class="stat mr-50">
                    <h3>{{ toRawFixedValue(compound.finalAmount, 2) }}</h3>
                    <h5>Total Amount</h5>
                  </div>
                  <div class="stat">
                    <h3>{{ toRawFixedValue(compound.compoundAmount, 2) }}</h3>
                    <h5>Earned Amount</h5>
                  </div>
                </div>
              </div>
              <div v-if="compound">
                <ProjectionsChart
                  :series="compound.series"
                  :seriesMin="compound.seriesMin"
                  :seriesMax="compound.seriesMax"
                />
              </div>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>

    <Row style="padding: 20px 0 0">
      <Col span="12" class="responsive-card">
        <Card shadow>
          <StockComparisonChart />
        </Card>
      </Col>

      <Col span="12" class="responsive-card">
        <Card shadow>
          <UnitArbChart />
        </Card>
      </Col>
    </Row>

    <Row style="padding: 20px 0 0">
      <Col span="12" class="responsive-card">
        <Card shadow>
          <h3>AAVE Rates</h3>
          <!-- <button>Trade Now</button> -->
          <template v-for="item in rewards">
            <InterestItem :data="item" />
          </template>
        </Card>
      </Col>

      <Col span="12" class="responsive-card">
        <Card shadow>
          <h3>Staking Rates</h3>
          <!-- <button>Stake Now</button> -->

          <template v-for="item in staking">
            <InterestItem v-if="item.spread != '0' && parseFloat(item.spread) > 0.01" :data="item" />
          </template>
        </Card>
      </Col>
    </Row>
  </div>
</template>

<script>
import gql from 'graphql-tag'
import { mapGetters } from 'vuex'
import { GetCompound, GetStakes, GetRewards } from '@/gql/research'
import { displayAsCurrency, toRawFixedValue } from '@/utils/filters'
import ProjectionsChart from '@/components/ProjectionsChart.vue'
import StockComparisonChart from '@/components/StockComparisonChart.vue'
import UnitArbChart from '@/components/UnitArbChart.vue'
import InterestItem from '@/components/InterestItem.vue'
import AssetItem from '@/components/AssetItem.vue'
// import brands from '../../static/brandColors.json'

const getExtendedData = a => {
  if (!a.symbol) return a
  const sym = a.symbol.toLowerCase()
  let brand

  // brands.forEach(b => {
  //   if (b.symbol === sym) brand = b
  // })

  if (!brand) return

  // add img url
  const baseUrl = window.location.host.search('localhost') !== -1 ? '/static/' : '/'
  a.logo = `${baseUrl}logos/${brand.name.replace(/ /g, '_').toLowerCase()}_${sym}.png`

  return a
}

export default {
  name: 'Research',

  data() {
    return {
      toRawFixedValue,

      projectionTab: 'Account',
      calcLoanSymbol: null,
      calcStakeSymbol: null,
      initialAmount: null,
      annualRate: null,
      spread: null,
      years: 1,

      activeItems: {
        account: null,
        stake: null,
        loan: null,
      },

      toggles: {
        account: false,
        stake: false,
        loan: false,
      },
    }
  },

  components: {
    ProjectionsChart,
    StockComparisonChart,
    UnitArbChart,
    InterestItem,
    AssetItem,
  },

  apollo: {
    staking: {
      query: gql`${GetStakes}`,
      result ({ data }) {
        if (!data || !data.staking) return {}
        const arr = data.staking.filter(f => f.symbol).sort((a, b) => (parseFloat(b.reward) - parseFloat(a.reward)))

        // setup initial Values
        if (!this.initialAmount && !this.annualRate) this.setInitial(data.staking)
        if (!this.activeItems.stake) this.activeItems.stake = getExtendedData(arr[0])

        return arr
      },
    },
    rewards: {
      query: gql`${GetRewards}`,
      result ({ data }) {
        if (!data || !data.rewards) return {}
        const arr = data.rewards.sort((a, b) => (b.rate - a.rate))
        if (!this.activeItems.loan) this.activeItems.loan = getExtendedData(arr[0])
        return arr
      },
    },
    compound: {
      query: gql`${GetCompound}`,
      result ({ data }) {
        if (!data || !data.compound) return {}
        return data.compound
      },
      variables: {
        initialAmount: `${this.initialAmount || 1}`,
        annualRate: `${this.annualRate || 1}`,
        years: `${this.years || 1}`,
        spread: `${this.spread || 0}`,
      },
    },
  },

  computed: {
    ...mapGetters(['assets', 'holdings']),
    allAccounts() {
      if (!this.holdings || !this.holdings.length) return []
      let syms = []
      let fin = []
      this.holdings.forEach(i => {
        const a = getExtendedData(i)
        const sym = i.symbol.toLowerCase()

        if (!syms.includes(sym)) {
          fin.push(a)
          syms.push(sym)
        }
      })
      return fin
    },
    allStakingSymbols() {
      if (!this.staking) return []
      let syms = []
      let fin = []
      this.staking.forEach(i => {
        const a = getExtendedData(i)
        const sym = i.symbol.toLowerCase()

        if (!syms.includes(sym)) {
          fin.push(a)
          syms.push(sym)
        }
      })
      return fin
    },
    allLoanSymbols() {
      if (!this.rewards) return []
      let syms = []
      let fin = []
      this.rewards.map(e => {
        const a = getExtendedData(e)
        const sym = e.symbol.toUpperCase()

        if (!syms.includes(sym)) {
          fin.push(a)
          syms.push(sym)
        }
      })
      return fin
    },
  },

  methods: {
    setInitial(stakes) {
      let hasStaked = (this.holdings.filter(h => h.totalStaked)).length > 0
      let stake
      let initialAmount = 0
      let annualRate = 0
      let spread = 0

      if (hasStaked) {
        this.holdings.sort((a, b) => (b.totalStaked - a.totalStaked)).forEach(h => {
          if (h.totalStaked) {
            stakes.forEach(s => {
              if (s.symbol === h.symbol && !stake) {
                stake = s
                initialAmount = h.totalUnits
                annualRate = s.reward
                spread = s.spread
              }
            })
          }
        })
      } else {
        this.holdings.forEach(h => {
          stakes.forEach(s => {
            if (s.symbol === h.symbol && !stake) {
              stake = s
              initialAmount = h.totalUnits
              annualRate = s.reward
              spread = s.spread
            }
          })
        })
      }

      // get account balance that has staking
      this.initialAmount = initialAmount
      this.annualRate = annualRate
      this.spread = spread
    },
    setCompound() {
      const params = {
        initialAmount: `${this.initialAmount || 1}`,
        annualRate: `${this.annualRate || 1}`,
        years: `${this.years || 1}`,
        spread: `${this.spread || 0}`,
      }

      this.$apollo.queries.compound.refetch(params)
    },
    toggleTypeItems(type) {
      this.toggles[type] = !this.toggles[type]
    },
    chooseTypeItem(type, item) {
      if (!item) return
      this.annualRate = `${item.reward || item.rate || 0}`
      this.spread = `${item.spread || 0}`
      this.toggles[type] = false
      this.activeItems[type] = item
    },
    initHoldings() {
      if (!this.holdings || !this.holdings.length) return
      if (!this.activeItems.account) this.activeItems.account = getExtendedData(this.holdings[0])
    },
  },

  watch: {
    initialAmount: ['setCompound'],
    annualRate: ['setCompound'],
    years: ['setCompound'],
    spread: ['setCompound'],
    calcStakeSymbol: ['setCompoundStake'],
    calcLoanSymbol: ['setCompoundLoan'],
    holdings: ['initHoldings'],
  },
}
</script>

<style>
/* .ivu-select-single .ivu-select-input {
  width: auto;
} */
.ivu-tabs {
  overflow: visible;
}
.ivu-tabs-content h5 {
  margin: 10px 0 5px;
}

.select-custom {
  position: relative;
}

.selected-item {
  display: flex;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 4px;
  padding: 0 5px;
}
.selected-item .ivu-icon {
  width: 30px;
  margin: auto;
}

.select-items {
  display: none;
  background: white;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 4px;
  box-shadow: 0 0 14px -2px rgba(0,0,0,0.1);
  padding: 0 5px;
  position: absolute;
  top: 40px;
  left: 0;
  right: 0;
  z-index: 99999;
}
.select-items.active {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  max-height: 40vh;
  overflow-y: scroll;
}
.select-item {}

.mr-50 {
  margin-right: 50px;
}

.stats-items {
  display: flex;
  /* justify-content: space-between; */
}
.stat h3 {
  font-size: 24pt;
  vertical-align: top;
  line-height: 18pt;
  display: inline-flex;
  font-weight: 400;
}
.stat h5 {
  font-size: 10pt;
  text-transform: uppercase;
  margin: 4px 0 10px;
  opacity: 0.5;
}
</style>
