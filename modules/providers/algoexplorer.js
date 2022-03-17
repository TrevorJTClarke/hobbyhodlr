const axios = require('axios')
const { DECIMALS } = require('../blockchains/constants')

const supportedChains = {
  algo: true,
}

// all api requests need API key
const isSupported = () => true

// Example:
// {
//   "round": 8463369,
//   "address": "HWV437344G63HDPWGVAJFLK35XZEGSPCQMUVPYKEB4EZOIUQJD7KUVWUTQ",
//   "amount": 9067037939,
//   "pendingrewards": 8432998,
//   "amountwithoutpendingrewards": 9058604941,
//   "rewards": 62483490,
//   "status": "Offline",
//   "balance": 9067037939,
//   "numbertransactions": 6
// }
function getBalances(chainId) {
  if (!chainId || !supportedChains[chainId]) throw 'No chainId supplied'
  return async function(address, settings) {
    if (!address) throw 'No address supplied'
    const baseUrl = `https://api.algoexplorer.io/v1/account`
    let balance = 0
    let staked = 0
    let available = 0
    let rewards = 0
    let delegation = 0

    try {
      const { data } = await axios.get(`${baseUrl}/${address}`)
      let tmpAvailable = 0

      if (data) {
        available = data.balance / DECIMALS[chainId]
        // NOTE: Any balance is "staked" until moved
        delegation = data.amountwithoutpendingrewards / DECIMALS[chainId]
        rewards = data.pendingrewards / DECIMALS[chainId]
      }
    } catch (e) {
      console.log(`algoexplorer.${chainId}.getBalances()`, `${e}`.substring(0, 100), address)
      throw e.response.data || e.response || e
    }

    return [{
      address,
      totalUnits: balance,
      totalStaked: delegation,
      totalPendingRewards: rewards,
    }]
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
