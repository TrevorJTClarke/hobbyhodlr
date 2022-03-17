<template>
  <div>
    <h2>Goals</h2>

    <Alert v-if="goals && goals.length <= 0" show-icon style="margin: 20px 0 0;padding-left:109px">
      No Goals Yet
      <Icon type="ios-list-box" slot="icon" size="60" />
      <div slot="desc" style="display:flex;flex-direction:column">
        <p>Add a goal and the summary will show here!</p>
        <Button type="primary" to="/accounts" style="margin:10px auto 10px 0;">
          Add Goal
        </Button>
      </div>
    </Alert>

    <DonutSummaryType v-if="goals && goals.length > 0" :data="goals" idx="goalChart" />

    <div v-if="$apollo.queries.goals && $apollo.queries.goals.loading" class="list-blank">
      <Spin size="large" fix></Spin>
    </div>
  </div>
</template>

<script>
import gql from 'graphql-tag'
import { mapGetters } from 'vuex'
import { GetGoals } from '../gql/goal'
import DonutSummaryType from '@/components/DonutSummaryType.vue'

export default {
  name: 'GoalsSummary',

  components: {
    DonutSummaryType,
  },

  apollo: {
    goals: {
      query: gql`${GetGoals}`,
      variables() {
        return {
          userId: this.user._id,
        }
      },
      result({ data }) {
        if (!data || !data.goals) return {}
        return data.goals || []
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
