const axios = require('axios')
const { DECIMALS } = require('../blockchains/constants')

const supportedChains = {
  xtz: true,
}

// all api requests need API key
const isSupported = () => true

function getBalances(chainId) {
  if (!chainId || !supportedChains[chainId]) return Promise.reject('No chainId supplied')
  return async function(address, settings) {
    if (!address) return Promise.reject('No address supplied')
    const baseUrl = `https://node1.sg.tezos.org.sg/explorer/account`
    const queryParams = ''
    const accounts = []

    try {
      const { data } = await axios.get(`${baseUrl}/${address}${queryParams}`)
      if (data) {
        const totalUnits = data.total_balance ? parseFloat(data.total_balance) : 0
        const staked = data.frozen_rewards ? parseFloat(data.frozen_rewards) : 0
        accounts.push({
          address,
          totalUnits,
          totalStaked: staked,
          totalPendingRewards: 0,
        })
      }
    } catch (e) {
      console.log(`tezosorg.${chainId}.getBalances()`, `${e}`.substring(0, 100), address)
      throw e.response.data || e.response || e
    }

    return accounts
  }
}

const getSupportedChainMethods = () => {
  const methods = {}

  for (const k in supportedChains) {
    methods[k] = methods[k] || {}
    methods[k].getBalances = getBalances(k)
  }

  return methods
}

module.exports = {
  isSupported,
  chains: {
    ...getSupportedChainMethods(),
  },
}
