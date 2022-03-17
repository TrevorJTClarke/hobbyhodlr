<template>
  <div>
    <Row>
      <Col span="12">
        <h2>Owned Accounts</h2>
      </Col>
      <Col span="12">
        <Button @click="modalAccount = true" style="float: right;" type="primary">
          Add Account
        </Button>
      </Col>
    </Row>
    <br>

    <div v-if="$apollo.queries.accounts.loading == false" v-for="item in accounts">
      <div class="accounts-item">
        <AccountItem :data="item" />
        <div class="item-actions">
          <Button v-if="item.subtype != 'provider'" size="large" ghost @click="editItem(item)">
            <Icon type="ios-create-outline" />
          </Button>
          <Button size="large" ghost @click="removeItem(item)">
            <Icon type="ios-trash" />
          </Button>
        </div>
      </div>
    </div>
    <div v-if="$apollo.queries.accounts.loading" class="list-blank">
      <Spin size="large" fix></Spin>
    </div>

    <!--  -->
    <Modal v-model="modalAccount" :loading="loading" @on-ok="addAccount" @on-cancel="resetModal" :okText="modalText" cancelText="Cancel" :footer-hide="loadingProvider">
      <section v-if="!loadingProvider">
        <Row>
          <Tabs :animated="false">
            <TabPane label="Automatic">

              <Row style="margin-bottom:10px" :gutter="15">
                <Col span="8">
                  <button class="auth-button sb-wc" @click.prevent="loginWith('WalletConnect')">
                    <img src="../assets/walletconnect.svg" alt="">
                    <span>WalletConnect</span>
                  </button>
                </Col>
                <Col v-if="providerMetaMaskEnabled" span="8">
                  <button class="auth-button sb-mm" @click.prevent="loginWith('MetaMask')">
                    <img src="../assets/metamask.svg" alt="">
                    <span>MetaMask</span>
                  </button>
                </Col>
                <!-- <Col span="8">
                  <button class="auth-button sb-po" @click.prevent="loginWith('Portis')">
                    <img src="../assets/portis.svg" alt="">
                    <span>Portis</span>
                  </button>
                </Col> -->
              </Row>

              <Divider>
                Coming Soon
              </Divider>

              <Row style="margin-bottom:10px" :gutter="15">
                <Col span="8">
                  <button class="auth-button disabled sb-cb" @click.prevent="loginWith('')">
                    <img src="../assets/coinbasewallet.svg" alt="">
                    <span>Coinbase</span>
                  </button>
                </Col>
                <!-- <Col span="8">
                  <button class="auth-button disabled sb-rh" @click.prevent="loginWith('')">
                    <img src="../assets/robinhood.svg" alt="">
                    <span>Robinhood</span>
                  </button>
                </Col> -->
                <Col span="8">
                  <button class="auth-button disabled sb-le" @click.prevent="loginWith('')">
                    <img src="../assets/ledger.svg" alt="">
                    <span>Ledger</span>
                  </button>
                </Col>
                <Col span="8">
                  <button class="auth-button disabled sb-tr" @click.prevent="loginWith('')">
                    <img src="../assets/trezor.svg" alt="">
                    <span>Trezor</span>
                  </button>
                </Col>
                <!-- <Col span="8">
                  <button class="auth-button disabled sb-fo" @click.prevent="loginWith('')">
                    <img src="../assets/fortmatic.svg" alt="">
                    <span>Fortmatic</span>
                  </button>
                </Col> -->
              </Row>

            </TabPane>
            <TabPane label="Manual">

              <Row style="margin-bottom:10px">
                <h4 style="margin-bottom:5px">Preview</h4>
                <div class="asset-preview">
                  <AssetItem :data="tmpAccountAsset" />
                </div>
              </Row>

              <Alert v-if="requiresManualAmount" type="warning" show-icon>
                Missing Manual Balance Amount
                <template slot="desc">
                  This asset does not automatically track balances.
                </template>
              </Alert>

              <Row style="margin-bottom:20px">
                <h4 style="margin-bottom:5px">Asset</h4>
                <Col span="24">
                  <i-select
                    v-model="newAccountAsset"
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

              <Row style="margin-bottom:20px">
                <h4 style="margin-bottom:5px">Account Address</h4>
                <Col span="24">
                  <Input v-model="newAddress" placeholder="0xfba2332..." />
                </Col>
              </Row>

              <Row style="margin-bottom:20px">
                <h4 style="margin-bottom:5px">Account Category & Nickname</h4>
                <Col span="24">
                  <Input v-model="newAccountNickname" placeholder="Example: Argent iOS">
                    <Select v-model="newAccountCategory" slot="prepend" style="width: 100px">
                      <Option v-for="t in accountTypes" :key="t" :value="t">{{ t }}</Option>
                    </Select>
                  </Input>
                </Col>
              </Row>

              <Row style="margin-bottom:20px">
                <h4 style="margin-bottom:5px">Manual Balance Amount</h4>
                <Col span="24">
                  <Input v-model="newAccountManualUnits" @on-blur="requiresManualAmount = false" placeholder="Example: 32" />
                </Col>
                <small>Used if tracking without API or unsupported by app. Use the Unit amount, not currency amount</small>
              </Row>

            </TabPane>
          </Tabs>
        </Row>

      </section>
      <section v-if="loadingProvider">
        <Row class="provider-loading">
          <!-- <img v-if="providerName == 'Portis'" src="../assets/portis.svg" alt=""> -->
          <img v-if="providerName == 'MetaMask'" src="../assets/metamask.svg" alt="">
          <img v-if="providerName == 'WalletConnect'" src="../assets/walletconnect.svg" alt="">
          <img v-if="providerName == 'Coinbase'" src="../assets/coinbasewallet.svg" alt="">
          <!-- <img v-if="providerName == 'Robinhood'" src="../assets/robinhood.svg" alt=""> -->
          <img v-if="providerName == 'Ledger'" src="../assets/ledger.svg" alt="">
          <img v-if="providerName == 'Trezor'" src="../assets/trezor.svg" alt="">
          <!-- <img v-if="providerName == 'Fortmatic'" src="../assets/fortmatic.svg" alt=""> -->
          <h3>{{ providerText }}</h3>
          <Spin size="large"></Spin>
        </Row>
      </section>
    </Modal>
  </div>
</template>

<script>
import gql from 'graphql-tag'
import { mapGetters, mapActions } from 'vuex'
import { SearchAssets, GetSupportedSymbols } from '../gql/asset'
import { GetAccounts, UpdateAccount, RemoveAccount } from '../gql/account'
import { accountTypes } from '../utils/constants'
import { hashShorten } from '../utils/filters'
import AccountItem from './AccountItem.vue'
import AssetItem from './AssetItem.vue'
import WalletConnectProvider from '@walletconnect/web3-provider'
// import Portis from '@portis/web3'
import Web3 from 'web3'

export default {
  name: 'AccountsList',
  data () {
    return {
      newAddress: null,
      newAccountId: '',
      newAccountAsset: '',
      newAccountManualUnits: null,
      newAccountNickname: '',
      newAccountCategory: accountTypes[0],
      loading: false,
      submitting: false,
      editing: false,
      requiresManualAmount: false,
      assetOptions: [],

      accountTypes,
      modalAccount: false,
      loading: false,
      loadingProvider: false,
      providerName: null,
      providerText: '',
      providerMetaMaskEnabled: false,
    }
  },

  components: {
    AssetItem,
    AccountItem,
  },

  apollo: {
    accounts: {
      query: gql`${GetAccounts}`,
      variables() {
        return {
          userId: this.user._id,
        }
      },
      result({ data }) {
        if (!data || !data.accounts) return {}
        return data.accounts
      },
    },
    supportedSymbols: {
      query: gql`${GetSupportedSymbols}`,
      result({ data }) {
        if (!data || !data.supportedSymbols) return []
        return data.supportedSymbols
      },
    },
  },

  computed: {
    ...mapGetters(['user', 'portisDappId', 'infuraId']),
    modalText() {
      return this.editing ? 'Update' : 'Submit'
    },
    tmpAccountAsset() {
      return this.newAccountAsset
        ? { ...this.newAccountAsset, totalUnits: this.newAccountManualUnits || 1 }
        : { name: '-', symbol: '-', totalUnits: 1 }
    },
    allAccounts() {
      if (!this.accounts || this.accounts.length <= 0) return []
      return this.accounts.map(g => {
        const asset = {
          ...g.asset,
          totalUnits: g.totalUnits,
          decimals: '0',
        }
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
      this.requiresManualAmount = false
      this.loadingProvider = false
      this.newAddress = null
      this.newAccountId = ''
      this.newAccountAsset = null
      this.newAccountManualUnits = null
      this.newAccountNickname = ''
      this.newAccountCategory = accountTypes[0]
    },
    submitSearchQuery(query) {
      return this.$apollo.query({
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
    },
    async searchAssets(query) {
      if (query !== '' && query.length > 1) {
        this.loading = true
        const res = await this.submitSearchQuery(query)
        this.assetOptions = res.data.assets.map(a => ({ ...a, label: a.symbol, value: a.name }))
        this.$nextTick(() => {
          this.loading = false
        })
      } else {
        this.assetOptions = []
      }
    },
    async addAccount() {
      this.loading = true
      const newAccount = {
        userId: this.user._id,
        assetId: this.newAccountAsset._id,
        type: this.newAccountAsset.type,
        address: this.newAddress ? `${this.newAddress}` : null,
        symbol: this.newAccountAsset.symbol || '',
      }

      // check if this asset doesnt belong to supported blockchains, if not, REQUIRE manualUnits
      if (!this.supportedSymbols.includes(newAccount.symbol.toLowerCase()) && !this.newAccountManualUnits) {
        this.requiresManualAmount = true
        setTimeout(() => {
          this.modalAccount = true
        }, 10)
        return
      }

      // Add data to payload
      if (this.newAccountManualUnits) newAccount.manualUnits = `${this.newAccountManualUnits}`
      if (this.newAccountNickname) newAccount.nickname = this.newAccountNickname
      if (this.newAccountCategory) newAccount.category = this.newAccountCategory

      // Basic fallback data settings
      if (newAccount.type === 'security') {
        newAccount.category = accountTypes[2]
        newAccount.address = newAccount.address || `${this.newAccountAsset.name || this.newAccountAsset.value}`
        newAccount.nickname = newAccount.nickname || `${this.newAccountAsset.subtype}${newAccount.manualUnits ? ' - Manual Shares: ' + newAccount.manualUnits : ''}`
      }
      if (newAccount.type === 'cryptocurrency') {
        newAccount.category = newAccount.category || accountTypes[0]
        newAccount.address = newAccount.address || `${this.newAccountAsset.name || this.newAccountAsset.value} ${`${+new Date()}`.substring(6,10)}`
        newAccount.nickname = newAccount.nickname || `${newAccount.manualUnits ? ' Manual Amount: ' + newAccount.manualUnits : ''}`
      }

      // Check if the address doesn't exist yet!!
      let hasAddress = false
      this.accounts.forEach(a => {
        if (a.address === newAccount.address) hasAddress = true
      })
      if (hasAddress) {
        this.resetForm()
        return
      }

      if (this.newAccountId) newAccount._id = this.newAccountId
      else newAccount.createdAt = new Date()
      this.updateItem(newAccount)
      this.resetForm()
      this.modalAccount = false
    },
    async updateItem(item) {
      await this.$apollo.mutate({
        mutation: gql`${UpdateAccount}`,
        variables: item
      })
      this.$apollo.queries.accounts.refetch()
      this.resetForm()
    },
    async removeItem(item) {
      const c = confirm('Are you sure you want to delete this account?')
      if (c) {
        await this.$apollo.mutate({
          mutation: gql`${RemoveAccount}`,
          variables: { id: item._id }
        })

        this.$apollo.queries.accounts.refetch()
      }
    },
    editItem(item) {
      this.newAccountId = item._id
      this.newAccountAsset = item.asset
      this.newAccountNickname = item.nickname
      this.newAccountCategory = item.category
      this.newAddress = item.address
      this.newAccountManualUnits = item.manualUnits
      this.editing = true
      this.modalAccount = true
    },
    async loginWith(providerName) {
      if (!providerName) return
      this.providerName = providerName
      this.providerText = `Loading ${providerName} Accounts…`
      this.loadingProvider = true

      switch (providerName) {
        case 'MetaMask':
          this.authProviderMetaMask()
          break;
        case 'WalletConnect':
          this.authProviderWalletConnect()
          break;
        // case 'Portis':
        //   this.authProviderPortis()
        //   break;
        default:
      }
    },

    resetModal() {
      this.providerName = null
      this.loadingProvider = false
    },
    setSetupText(count) {
      this.providerText = `Setting up ${count} ${this.providerName} Account${count !== 1 ? 's' : ''}...`
    },

    detectMetaMask() {
      this.providerMetaMaskEnabled = typeof window.ethereum !== 'undefined' && ethereum.isMetaMask
    },
    async loadEthProvider(provider) {
      const web3 = new Web3(provider)
      const accounts = await web3.eth.getAccounts()
      this.loadEthAccounts(accounts)
    },
    async loadEthAccounts(accounts) {
      if (!accounts || accounts.length <= 0) {
        this.resetForm()
        this.modalAccount = false
        return
      }
      const finAccounts = []
      this.setSetupText(accounts.length)

      // Get ethereum asset
      const res = await this.submitSearchQuery('ethereum')
      const asset = res && res.data && res.data.assets && res.data.assets.length > 0 ? res.data.assets[0] : null
      if (!asset) {
        this.resetForm()
        return
      }

      // Format to needed
      accounts.forEach(address => {
        let hasAccount = false
        this.accounts.forEach(ca => {
          if (ca.address === address) hasAccount = true
        })
        if (!hasAccount) {
          finAccounts.push({
            userId: this.user._id,
            assetId: asset._id,
            type: 'cryptocurrency',
            subtype: 'provider',
            address: `${address}`,
            symbol: 'eth',
            nickname: `${this.providerName} Account ${hashShorten(address)}`,
            category: `wallet`,
          })
        }
      })
      if (finAccounts.length <= 0) {
        this.resetForm()
        this.modalAccount = false
        return
      }

      // Submit all formatted accounts to DB
      if (finAccounts.length > 0) {
        for (const item of finAccounts) {
          await this.updateItem(item)
        }
      }

      this.resetForm()
      this.modalAccount = false
    },
    // async authProviderPortis() {
    //   if (!this.portisDappId) throw new Error('No portis dapp id configured!')
    //   const portis = new Portis(this.portisDappId, 'mainnet')
    //   this.loadEthProvider(portis.provider)
    // },
    async authProviderWalletConnect() {
      if (!this.infuraId) throw new Error('No infura id configured!')
      const provider = new WalletConnectProvider({ infuraId: this.infuraId })
      await provider.enable()
      this.loadEthProvider(provider)
    },
    async authProviderMetaMask() {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
      this.loadEthAccounts(accounts)
    },
  },

  mounted() {
    this.detectMetaMask()
  },
}
</script>

<style>
.accounts-item {
  display: flex;
}
.accounts-item .account-item {
  width: 100%;
}
.item-actions {
  display: flex;
  justify-content: space-between;
  margin: auto 5px auto 20px;
  opacity: 0.25;
}
.accounts-item:hover .item-actions {
  opacity: 1;
}
.item-actions .ivu-btn-large {
  height: 100%;
  border: 0px;
  padding: 0 5px;
  font-size: 21pt;
}

.auth-buttons {
  display: grid;
}

.auth-button {
  background: var(--bg-secondary);
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: 4px;
  box-shadow: 0 1px 25px -4px rgba(0,0,0,0);
  padding: 7px 15px 15px;
  display: flex;
  flex-direction: column;
  margin: 10px 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  transition: all 220ms ease;
}

.auth-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.auth-button:hover {
  box-shadow: 0 1px 15px -4px rgba(0,0,0,0.2);
}
.auth-button.sb-wc:hover {
  background: rgba(57,148,243,0.2);
}
.auth-button.sb-mm:hover {
  background: rgba(247,154,68,0.2);
}
.auth-button.sb-tr:hover {
  background: rgba(1,183,87,0.2);
}
.auth-button.sb-le:hover {
  background: rgba(65,204,180,0.2);
}
.auth-button.sb-cb:hover {
  background: rgba(21,79,233,0.2);
}
.auth-button.sb-po:hover {
  background: rgba(28, 77, 107,0.2);
}
.auth-button.sb-fo:hover {
  background: rgba(104,82,255,0.2);
}
.auth-button.sb-rh:hover {
  background: rgba(70,180,140,0.2);
}
.auth-button img {
  max-width: 45px;
  max-height: 45px;
  margin: 10px auto 5px;
}
.auth-button span {
  text-align: center;
  width: 100%;
  color: var(--body-color);
}

.provider-loading {
  margin: 60px 0;
}
.provider-loading h3 {
  text-align: center;
}
.provider-loading .ivu-spin {
  display: flex;
}
.provider-loading .ivu-spin .ivu-spin-main {
  margin: 20px auto 0;
}

.provider-loading img {
  width: 120px;
  height: 120px;
  margin: 10px auto 20px;
  display: flex;
}
</style>
