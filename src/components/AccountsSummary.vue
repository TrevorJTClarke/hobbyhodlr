<template>
  <div>
    <h2>Balances</h2>

    <Alert v-if="holdings && holdings.length <= 0" show-icon style="margin: 20px 0 0;padding-left:109px">
      No Balances Yet
      <Icon type="ios-cash" slot="icon" size="60" />
      <div slot="desc" style="display:flex;flex-direction:column">
        <p>Add an account and balance summary will show here!</p>
        <Button type="primary" to="/accounts" style="margin:10px auto 10px 0;">
          Add Account
        </Button>
      </div>
    </Alert>

    <DonutSummaryType v-if="holdings && holdings.length > 0" :data="holdings" idx="balanceChart" />
    <div v-if="$apollo.queries.holdings && $apollo.queries.holdings.loading" class="list-blank">
      <Spin size="large" fix></Spin>
    </div>
  </div>
</template>

<script>
import gql from 'graphql-tag'
import { mapGetters } from 'vuex'
import { GetHoldings } from '../gql/account'
import DonutSummaryType from '@/components/DonutSummaryType.vue'

export default {
  name: 'AccountsSummary',

  components: {
    DonutSummaryType,
  },

  apollo: {
    holdings: {
      query: gql`${GetHoldings}`,
      variables() {
        return {
          userId: this.user._id,
        }
      },
      result({ data }) {
        if (!data || !data.holdings) return []
        return data.holdings
      },
    },
  },

  computed: {
    ...mapGetters(['user']),
  },
}
</script>

<style>
.list-blank {
  min-height: 15vh;
}
</style>
