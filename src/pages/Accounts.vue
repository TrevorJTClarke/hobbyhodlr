<template>
  <div>
    <Row style="padding: 0">
      <Col span="12" class="responsive-card">
        <Card shadow>
          <AccountsList />
        </Card>
      </Col>

      <Col span="12" class="responsive-card">
        <Card shadow>
          <GoalsList />
        </Card>
      </Col>
    </Row>
  </div>
</template>

<script>
import AccountsList from '../components/AccountsList.vue'
import GoalsList from '../components/GoalsList.vue'

export default {
  name: 'Accounts',

  components: {
    AccountsList,
    GoalsList,
  },
}
</script>
