<template>
  <div>
    <Row style="padding: 0; position: relative; z-index:9">
      <Col span="24">
        <Card shadow class="chart-card" :padding="0">
          <AccountSeries />
        </Card>
      </Col>
    </Row>

    <Row style="padding: 20px 0 0">
      <Col span="24">
        <Card shadow>
          <GoalsOverview />
        </Card>
      </Col>
    </Row>

    <Row style="padding: 20px 0 0">
      <Col span="12" class="responsive-card">
        <Card shadow>
          <AccountsSummary />
        </Card>
      </Col>

      <Col span="12" class="responsive-card">
        <Card shadow>
          <GoalsSummary />
        </Card>
      </Col>

    </Row>
  </div>
</template>

<script>
import AccountSeries from '@/components/AccountSeries.vue'
import AccountsSummary from '@/components/AccountsSummary.vue'
import GoalsSummary from '@/components/GoalsSummary.vue'
import GoalsOverview from '@/components/GoalsOverview.vue'

export default {
  name: 'Home',

  components: {
    AccountSeries,
    AccountsSummary,
    GoalsSummary,
    GoalsOverview,
  },
}
</script>

<style scoped>
.chart-card {
  padding: 32px 0 0px;
}

@media (max-width: 800px) {
  .chart-card {
    padding: 20px 0 0px;
  }
}
</style>
