<template>
  <div>
    <Row>
      <Col span="12">
        <h2>Goals</h2>
      </Col>
      <Col span="12">
        <Button @click="modalGoal = true" style="float: right;" type="primary">
          New Goal
        </Button>
      </Col>
    </Row>
    <br>

    <div v-if="$apollo.queries.goals.loading == false" v-for="item in allGoals">
      <div class="goal-item">
        <AssetItem :data="item.asset" :parent="item" :hide-price="true" />
        <div class="item-actions">
          <Button size="large" ghost @click="editItem(item)">
            <Icon type="ios-create-outline" />
          </Button>
          <Button size="large" ghost @click="removeItem(item)">
            <Icon type="ios-trash" />
          </Button>
        </div>
      </div>
    </div>
    <div v-if="$apollo.queries.goals.loading" class="list-blank">
      <Spin size="large" fix></Spin>
    </div>

    <Modal v-model="modalGoal" title="Create a new Goal" :okText="modalText" cancelText="Cancel" :loading="loading" @on-ok="submitGoal">
      <Row style="margin-bottom:10px">
        <h4 style="margin-bottom:5px">Preview</h4>
        <div class="asset-preview">
          <AssetItem :data="newGoalAsset" />
        </div>
      </Row>
      <Row style="margin-bottom:20px">
        <h4 style="margin-bottom:5px">Asset</h4>
        <Col span="24">
          <i-select
            v-model="newGoalSymbol"
            filterable
            remote
            :remote-method="searchAssets"
            :loading="loading"
            placeholder="Search for an asset by name"
            not-found-text="No assets found."
          >
            <i-option v-for="(asset, index) in assetOptions" :value="asset" :key="index">{{ asset.value }} ({{ asset.label.toUpperCase() }})</i-option>
          </i-select>
        </Col>
      </Row>
      <Row style="margin-bottom:10px">
        <h4 style="margin-bottom:5px">Goal Amount</h4>
        <Col span="24">
          <Input v-model="newGoalUnits" placeholder="Example: 32" />
        </Col>
        <small>Units not Currency</small>
      </Row>
      <Spin size="large" fix v-if="submitting"></Spin>
    </Modal>
  </div>
</template>

<script>
import gql from 'graphql-tag'
import { mapGetters, mapActions } from 'vuex'
import { SearchAssets } from '../gql/asset'
import { GetGoals, RemoveGoal, UpdateGoal } from '../gql/goal'
import AssetItem from './AssetItem.vue'

export default {
  name: 'GoalsList',

  data () {
    return {
      newGoalId: '',
      newGoalSymbol: '',
      newGoalUnits: 1,
      modalGoal: false,
      loading: false,
      submitting: false,
      editing: false,
      assetOptions: [],
    }
  },

  components: {
    AssetItem,
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
        // this.update({ key: 'goals', value: goals })
        return data.goals
      },
    },
  },

  computed: {
    ...mapGetters(['user']),
    modalText() {
      return this.editing ? 'Update' : 'Submit'
    },
    newGoalAsset() {
      return this.newGoalSymbol
        ? { ...this.newGoalSymbol, totalUnits: this.newGoalUnits }
        : { name: '-', symbol: '-', totalUnits: 1 }
    },
    allGoals() {
      if (!this.goals || this.goals.length <= 0) return []
      return this.goals.map(g => {
        const asset = {
          ...g.asset,
          totalUnits: g.totalUnits,
          decimals: '0',
        }
        // goals.push({
        //   ...g,
        //   asset,
        // })
        return {
          ...g,
          asset
        }
      })
    }
  },

  methods: {
    ...mapActions(['update']),
    resetForm() {
      // reset things
      this.loading = false
      this.submitting = false
      this.editing = false
      this.newGoalSymbol = {}
      this.newGoalUnits = 1
      this.newGoalId = ''
    },
    async searchAssets(query) {
      if (query !== '' && query.length > 1) {
        this.loading = true
        const res = await this.$apollo.query({
          query: gql`${SearchAssets}`,
          debounce: 250,
          variables: {
            search: query,
            field: 'name',
            limit: 100,
            filters: null
            // NOTE:s
            // future: "{\"type\":\"security\"}"
            // also supports: "symbol": "ada" directly
          }
        })
        this.assetOptions = res.data.assets.map(a => ({ ...a, label: a.symbol, value: a.name, decimals: 0 }))
        this.$nextTick(() => {
          this.loading = false
        })
      } else {
        this.assetOptions = []
      }
    },
    submitGoal() {
      if (!this.newGoalSymbol || !this.newGoalUnits) return
      this.submitting = true
      const asset = { ...this.newGoalSymbol }
      const item = {
        userId: this.user._id,
        assetId: asset._id,
        totalUnits: this.newGoalUnits || '',
        currencyAmount: `${(parseFloat(asset.currentPrice || 0) * parseFloat(this.newGoalUnits))}`,
      }

      if (this.newGoalId) item._id = this.newGoalId
      else item.createdAt = new Date()
      this.updateItem(item)
    },
    async updateItem(item) {
      await this.$apollo.mutate({
        mutation: gql`${UpdateGoal}`,
        variables: item
      })
      this.$apollo.queries.goals.refetch()
      this.resetForm()
    },
    async removeItem(item) {
      const c = confirm('Are you sure you want to delete this goal?')
      if (c) {
        await this.$apollo.mutate({
          mutation: gql`${RemoveGoal}`,
          variables: { id: item._id }
        })

        this.$apollo.queries.goals.refetch()
      }
    },
    editItem(item) {
      if (!item.asset.symbol || !item.totalUnits) return
      this.newGoalId = item._id
      this.newGoalSymbol = item.asset
      this.newGoalUnits = item.totalUnits
      this.editing = true
      this.modalGoal = true
    },
  },
}
</script>

<style>
.goal-item {
  display: flex;
}
.goal-item .asset-item {
  width: 100%;
}
.item-actions {
  display: flex;
  justify-content: space-between;
  margin: auto 5px auto 20px;
  opacity: 0.25;
}
.goal-item:hover .item-actions {
  opacity: 1;
}
.item-actions .ivu-btn-large {
  height: 100%;
  border: 0px;
  padding: 0 5px;
  font-size: 21pt;
}
.asset-preview {
  padding: 5px 10px 1px;
  border: 1px solid var(--bg-secondary);
  border-radius: 4px;
}

.list-blank {
  min-height: 15vh;
}
</style>
