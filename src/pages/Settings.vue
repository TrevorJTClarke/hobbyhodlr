<template>
  <div>
    <Row style="padding: 20px 0">
      <Col span="12">
        <h1>Settings</h1>
      </Col>
      <Col span="12">
        <Button type="primary" size="large" style="float: right;" @click="logoutUser">Logout</Button>
      </Col>
    </Row>
    <Row style="padding: 20px 0">
      <Card shadow>

        <Collapse simple>
          <Panel name="1">
            <h3 style="display: inline">General Preferences</h3>
            <div slot="content" style="padding: 20px 0">

              <h4>Data Polling Interval (in Minutes)</h4>
              <Row style="padding: 10px 0 0;margin-bottom:20px">
                <Col span="12" class="responsive-card">
                  <InputNumber :max="1000" :min="1" v-model="dataPollingIntervalKey" @on-blur="updateAdmin" style="min-width:200px" />
                </Col>
                <Col span="12" class="responsive-card">
                  <p>This interval triggers alert evaluations, default is 5 minutes. Note: changing this setting will increase API key usage (if any), which can lead to incurring higher fees for some API driven data sets. See API Keys section below to check if this will affect your pricing plan.</p>
                </Col>
              </Row>

            </div>
          </Panel>

          <Panel name="2">
            <h3 style="display: inline">Alerts Settings</h3>
            <div slot="content" style="padding: 20px 0">

              <h4>Asset Price Change</h4>
              <Row style="padding: 10px 0 0;margin-bottom:0px">
                <Col span="12" class="responsive-card">
                  <CheckboxGroup v-model="priceChangeThresholdsKey" @on-change="updateUserAlertSettings">
                    <Checkbox size="large" label="5%" />
                    <Checkbox size="large" label="10%" />
                    <Checkbox size="large" label="25%" />
                    <Checkbox size="large" label="50%" />
                    <Checkbox size="large" label="100%" />
                  </CheckboxGroup>
                </Col>
                <Col span="12" class="responsive-card">
                  <p>Choose the thresholds that will trigger alerts if the price moves above or below the percent change in price.<br>Example: Bitcoin price one hour ago is $10,000 and is now $10,501 - this will trigger the 5% alert.</p>
                </Col>
              </Row>
              <Row style="padding: 10px 0 0;margin-bottom:40px">
                <Col span="12" class="responsive-card">
                  <i-switch v-model="priceChangeRareKey" @on-change="updateUserAlertSettings" false-color="var(--tertiary-color)" />
                  <span>Rare Price Changes</span>
                </Col>
                <Col span="12" class="responsive-card">
                  <p>Rare price changes will alert upon percent over percent change activity.<br>Example: Bitcoin price starts at $10,000 then moves to $10,500 within an hour and finally the latest update is $11,000. This would trigger 5% + 5% rare price change alert.</p>
                </Col>
              </Row>

              <h4>Account Balance - Low Balance</h4>
              <Row style="padding: 10px 0 0;margin-bottom:40px">
                <Col span="12" class="responsive-card">
                  <InputNumber :max="100000" :min="0" v-model="accountBalanceLowKey" @on-blur="updateUserAlertSettings" style="min-width:200px" />
                </Col>
                <Col span="12" class="responsive-card">
                  <p>Triggers an alert when balance is less than $dollar amount specified. Example: If account balance is $300 and threshold is $100, then a transaction changes balance to $90, the alert will trigger. Setting to "0" turns this alert off.</p>
                </Col>
              </Row>

              <h4>Account Balance - Large Sum Moved</h4>
              <Row style="padding: 10px 0 0;margin-bottom:40px">
                <Col span="12" class="responsive-card">
                  <i-switch v-model="accountBalanceLargeSumKey" @on-change="updateUserAlertSettings" false-color="var(--tertiary-color)" />
                </Col>
                <Col span="12" class="responsive-card">
                  <p>Triggers an alert anytime a large sum moves on any accounts. This currently looks for balance changes of $1,000 or more.</p>
                </Col>
              </Row>

              <h4>Account Reward Balance</h4>
              <Row style="padding: 10px 0 0;margin-bottom:40px">
                <Col span="12" class="responsive-card">
                  <InputNumber :max="1000000" :min="0" v-model="accountRewardBalanceKey" @on-blur="updateUserAlertSettings" style="min-width:200px" />
                </Col>
                <Col span="12" class="responsive-card">
                  <p>The $dollar amount to alert when your rewards have gone above this amount. This alert will trigger once every time rewards go above this amount. Rewards are calculated by earned interest, stock dividends or staking validation rewards. Setting to "0" turns this alert off.</p>
                </Col>
              </Row>

              <h4>Price All-Time-High / All-Time-Low</h4>
              <Row style="padding: 10px 0 0;margin-bottom:40px">
                <Col span="12" class="responsive-card">
                  <i-switch v-model="priceAthAtlKey" @on-change="updateUserAlertSettings" false-color="var(--tertiary-color)" />
                </Col>
                <Col span="12" class="responsive-card">
                  <p>Triggers an alert when an asset price achieves a new all time high or all time low.<br>Example: Bitcoin usually trades around $10,000 and the all time high is $19,665. Today Bitcoin price moved to $25,000 - this would trigger an alert.</p>
                </Col>
              </Row>

              <h4>Alert Evaluation Interval (in Minutes)</h4>
              <Row style="padding: 10px 0 0;margin-bottom:0px">
                <Col span="12" class="responsive-card">
                  <InputNumber :max="1000" :min="5" v-model="alertCheckPriceIntervalKey" @on-blur="updateAdmin" style="min-width:200px" />
                </Col>
                <Col span="12" class="responsive-card">
                  <p>This internally triggers alert evaluations for price data, default is 5 minutes.</p>
                </Col>
              </Row>
              <Row style="padding: 10px 0 0;margin-bottom:0px">
                <Col span="12" class="responsive-card">
                  <InputNumber :max="3000" :min="5" v-model="alertCheckAccountIntervalKey" @on-blur="updateAdmin" style="min-width:200px" />
                </Col>
                <Col span="12" class="responsive-card">
                  <p>This internally triggers alert evaluations for account data, default is 1 hour.</p>
                </Col>
              </Row>

            </div>
          </Panel>

          <Panel name="3">
            <h3 style="display: inline">Notification Delivery</h3>
            <div slot="content" style="padding: 20px 0">

              <h4>Slack</h4>
              <Row style="padding: 10px 0 0;margin-bottom:0px">
                <Col span="12" class="responsive-card">
                  <i-switch v-model="slackAlertsActiveKey" @on-change="updateUserAlertSettings" false-color="var(--tertiary-color)" />
                </Col>
                <Col span="12" class="responsive-card">
                  <p>Turns Slack alerts on or off. Useful if you want to disable all alerts.</p>
                </Col>
              </Row>
              <Row style="padding: 10px 0 0;margin-bottom:0px">
                <Col span="12" class="responsive-card">
                  <Input v-model="slackHookIdKey" @on-blur="updateUser" style="width: 100%" />
                </Col>
                <Col span="12" class="responsive-card">
                  <p>To setup, go to <a href="https://api.slack.com/messaging/webhooks" target="_blank">slack.com</a>, follow the documentation to retrieve the webhook ID.</p>
                </Col>
              </Row>
              <Row style="padding: 10px 0 0;margin-bottom:20px">
                <Col span="12" class="responsive-card">
                  <Input v-model="slackChannelIdKey" @on-blur="updateUser" style="width: 100%">
                    <span slot="prepend">Channel #</span>
                  </Input>
                </Col>
              </Row>

              <h4>Rocketchat</h4>
              <Row style="padding: 10px 0 0;margin-bottom:0px">
                <Col span="12" class="responsive-card">
                  <i-switch v-model="rocketchatAlertsActiveKey" @on-change="updateUserAlertSettings" false-color="var(--tertiary-color)" />
                </Col>
                <Col span="12" class="responsive-card">
                  <p>Turns Rocketchat alerts on or off. Useful if you want to disable all alerts.</p>
                </Col>
              </Row>
              <Row style="padding: 10px 0 0;margin-bottom:0px">
                <Col span="12" class="responsive-card">
                  <Input v-model="rocketchatDomainKey" @on-blur="updateUser" style="width: 100%" />
                </Col>
                <Col span="12" class="responsive-card">
                  <p>This is your server domain, usually this is a domain name similar to "chat.example.com"</p>
                </Col>
              </Row>
              <Row style="padding: 10px 0 0;margin-bottom:0px">
                <Col span="12" class="responsive-card">
                  <Input v-model="rocketchatHookIdKey" @on-blur="updateUser" style="width: 100%" />
                </Col>
                <Col span="12" class="responsive-card">
                  <p>To setup, go to <a href="https://docs.rocket.chat/guides/administrator-guides/integrations#create-a-new-incoming-webhook" target="_blank">rocket.chat</a>, follow the documentation to retrieve the webhook ID.</p>
                </Col>
              </Row>
              <Row style="padding: 10px 0 0;margin-bottom:20px">
                <Col span="12" class="responsive-card">
                  <Input v-model="rocketchatChannelIdKey" @on-blur="updateUser" style="width: 100%">
                    <span slot="prepend">Channel #</span>
                  </Input>
                </Col>
              </Row>

            </div>
          </Panel>
          <Panel name="4">
            <h3 style="display: inline">Plugins & API Keys</h3>
            <div slot="content" style="padding: 20px 0">

              <h4>Alphavantage ID</h4>
              <Row style="padding: 10px 0 0;margin-bottom:20px">
                <Col span="12" class="responsive-card">
                  <Input v-model="alphavantageIdKey" @on-blur="updateAdmin" type="password" password style="width: 100%" />
                </Col>
                <Col span="12" class="responsive-card">
                  <p>Need this key? Go to <a href="https://www.alphavantage.co/" target="_blank">alphavantage.co</a>, create an account and register for an API Key.<br>Alphavantage is used for retrieving stock prices for traditional stock assets.</p>
                </Col>
              </Row>

              <h4>Amberdata ID</h4>
              <Row style="padding: 10px 0 0;margin-bottom:20px">
                <Col span="12" class="responsive-card">
                  <Input v-model="amberdataIdKey" @on-blur="updateAdmin" type="password" password style="width: 100%" />
                </Col>
                <Col span="12" class="responsive-card">
                  <p>Need this key? Go to <a href="https://amberdata.io/" target="_blank">amberdata.io</a>, create an account and register for an API Key.<br>Amberdata is used for retrieving account balances and transactions for several blockchains.</p>
                </Col>
              </Row>

              <h4>Blockchair ID</h4>
              <Row style="padding: 10px 0 0;margin-bottom:20px">
                <Col span="12" class="responsive-card">
                  <Input v-model="blockchairIdKey" @on-blur="updateAdmin" type="password" password style="width: 100%" />
                </Col>
                <Col span="12" class="responsive-card">
                  <p>Need this key? Go to <a href="https://blockchair.com/api/plans" target="_blank">blockchair.com</a>, create an account and register for an API Key.<br>Blockchair is used for retrieving account balances and transactions for several blockchains.</p>
                </Col>
              </Row>

              <h4>Infura ID</h4>
              <Row style="padding: 10px 0 0;margin-bottom:20px">
                <Col span="12" class="responsive-card">
                  <Input v-model="infuraIdKey" @on-blur="updateAdmin" type="password" password style="width: 100%" />
                </Col>
                <Col span="12" class="responsive-card">
                  <p>Need this key? Go to <a href="https://infura.io" target="_blank">infura.io</a>, create an account and register for a project ID.<br>Infura is used for retrieving account balances and transactions for Ethereum. Certain integrations like WalletConnect require a JSON-RPC provider like Infura to be enabled.</p>
                </Col>
              </Row>

              <!-- <h4>Portis ID</h4>
              <Row style="padding: 10px 0 0;margin-bottom:20px">
                <Col span="12" class="responsive-card">
                  <Input v-model="portisDappIdKey" @on-blur="updateAdmin" type="password" password style="width: 100%" />
                </Col>
                <Col span="12" class="responsive-card">
                  <p>Need this key? Go to <a href="https://dashboard.portis.io/" target="_blank">portis.io</a>, create an account and register for a Dapp ID.</p>
                </Col>
              </Row> -->

              <!-- <h4>Quandl ID</h4>
              <Row style="padding: 10px 0 0;margin-bottom:20px">
                <Col span="12" class="responsive-card">
                  <Input v-model="quandlIdKey" @on-blur="updateAdmin" type="password" password style="width: 100%" />
                </Col>
                <Col span="12" class="responsive-card">
                  <p>Need this key? Go to <a href="https://www.quandl.com/" target="_blank">quandl.com</a>, create an account and register for an API Key.</p>
                </Col>
              </Row> -->

            </div>
          </Panel>
        </Collapse>

      </Card>
    </Row>

  </div>
</template>

<script>
import gql from 'graphql-tag'
import { mapGetters, mapActions } from 'vuex'
import { GetAdmin, UpdateAdmin } from '../gql/admin'
import { GetUserSettings, UpdateUserSettings } from '../gql/settings'
import { GetUser, UpdateUser } from '../gql/user'

export default {
  name: 'Settings',

  data() {
    return {
      // general
      dataPollingIntervalKey: 5,
      alertCheckPriceIntervalKey: 5,
      alertCheckAccountIntervalKey: 60,

      // API Keys
      alphavantageIdKey: null,
      amberdataIdKey: null,
      blockchairIdKey: null,
      infuraIdKey: null,
      portisDappIdKey: null,
      quandlIdKey: null,

      // Notifications
      slackAlertsActiveKey: false,
      slackHookIdKey: null,
      slackChannelIdKey: 'general',
      rocketchatAlertsActiveKey: false,
      rocketchatDomainKey: null,
      rocketchatHookIdKey: null,
      rocketchatChannelIdKey: 'general',

      // alert settings
      priceChangeThresholdsKey: ['10%', '25%'],
      priceChangeRareKey: true,
      priceAthAtlKey: true,
      accountBalanceLowKey: 100,
      accountBalanceLargeSumKey: true,
      accountRewardBalanceKey: 50,
    }
  },

  apollo: {
    admin: {
      query: gql`${GetAdmin}`,
      result({ data }) {
        if (!data || !data.admin) return {}

        // loop and update local state
        Object.keys(data.admin).forEach(a => {
          if (a === '_id') a = 'adminId'
          if (Object.keys(this).includes(`${a}Key`)) {
            this.update({ key: a, value: data.admin[a] })
            this[`${a}Key`] = data.admin[a]
          }
        })

        return data.admin
      },
    },
    userSettings: {
      query: gql`${GetUserSettings}`,
      variables() {
        return {
          userId: this.user._id,
        }
      },
      result({ data }) {
        if (!data || !data.userSettings) return {}

        // loop and update local state
        Object.keys(data.userSettings).forEach(a => {
          if (Object.keys(this).includes(`${a}Key`)) {
            if (a === 'priceChangeThresholds' && typeof data.userSettings[a] === 'string') data.userSettings[a] = JSON.parse(data.userSettings[a])
            this.update({ key: a, value: data.userSettings[a] })
            this[`${a}Key`] = data.userSettings[a]
          }
        })

        return data.userSettings
      },
    },
  },

  computed: {
    ...mapGetters(['adminId', 'user']),
  },

  methods: {
    ...mapActions(['logout', 'update']),
    logoutUser() {
      this.logout()
      this.$router.replace('/auth')
    },
    async updateAdmin() {
      let data = {
        alphavantageId: this.alphavantageIdKey,
        amberdataId: this.amberdataIdKey,
        blockchairId: this.blockchairIdKey,
        infuraId: this.infuraIdKey,
        portisDappId: this.portisDappIdKey,
        quandlId: this.quandlIdKey,
        dataPollingInterval: this.dataPollingIntervalKey,
        alertCheckPriceInterval: this.alertCheckPriceIntervalKey,
        alertCheckAccountInterval: this.alertCheckAccountIntervalKey,
      }
      if (this.adminId) data._id = this.adminId
      let res

      try {
        res = await this.$apollo.mutate({
          mutation: gql`${UpdateAdmin}`,
          variables: data
        })
      } catch (e) {
        this.$Notice.error({
          title: 'Settings Update Error',
          desc: 'Please check your input and try again.'
        })
        return
      }

      this.$Notice.success({ title: 'Settings Updated' })

      if (res && res.data && res.data.updateAdmin) {
        // loop and update local state
        Object.keys(res.data.updateAdmin).forEach(a => {
          let b = a
          if (a === '_id') b = 'adminId'
          if (a === '__typename') return
          this.update({ key: b, value: res.data.updateAdmin[a] })
        })
      }
    },
    async updateUserAlertSettings() {
      const variables = {
        userId: this.user._id,
        slackAlertsActive: this.slackAlertsActiveKey,
        rocketchatAlertsActive: this.rocketchatAlertsActiveKey,
        priceChangeThresholds: JSON.stringify(this.priceChangeThresholdsKey).replace(/ /g, ''),
        priceChangeRare: this.priceChangeRareKey,
        priceAthAtl: this.priceAthAtlKey,
        accountBalanceLow: this.accountBalanceLowKey,
        accountBalanceLargeSum: this.accountBalanceLargeSumKey,
        accountRewardBalance: this.accountRewardBalanceKey,
      }

      try {
        await this.$apollo.mutate({
          mutation: gql`${UpdateUserSettings}`,
          variables,
        })
      } catch (e) {
        this.$Notice.error({
          title: 'Settings Update Error',
          desc: 'Please check your input and try again.'
        })
        return
      }

      this.$Notice.success({ title: 'Settings Updated' })
    },
    async updateUser() {
      let data = {}
      if (this.slackHookIdKey) data.slackHookId = this.slackHookIdKey
      if (this.slackChannelIdKey) data.slackChannelId = this.slackChannelIdKey
      if (this.rocketchatDomainKey) data.rocketchatDomain = this.rocketchatDomainKey
      if (this.rocketchatHookIdKey) data.rocketchatHookId = this.rocketchatHookIdKey
      if (this.rocketchatChannelIdKey) data.rocketchatChannelId = this.rocketchatChannelIdKey
      if (this.adminId) data._id = this.adminId
      let res

      try {
        res = await this.$apollo.mutate({
          mutation: gql`${UpdateAdmin}`,
          variables: data
        })
      } catch (e) {
        this.$Notice.error({
          title: 'Settings Update Error',
          desc: 'Please check your input and try again.'
        })
        return
      }

      this.$Notice.success({ title: 'Settings Updated' })

      if (res && res.data && res.data.updateUser) {
        // loop and update local state
        Object.keys(res.data.updateUser).forEach(a => {
          let b = a
          if (a === '_id') b = 'adminId'
          if (a === '__typename') return
          this.update({ key: b, value: res.data.updateUser[a] })
        })
      }
    },
  },
}
</script>

<style>
</style>
