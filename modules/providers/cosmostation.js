const axios = require('axios')
const { DECIMALS } = require('../blockchains/constants')

const supportedChains = {
  atom: true,
}

// all api requests need API key
const isSupported = () => true

function getBalances(chainId) {
  if (!chainId || !supportedChains[chainId]) return Promise.reject('No chainId supplied')
  return async function(address, settings) {
    if (!address) return Promise.reject('No address supplied')
    const baseUrl = `https://api.cosmostation.io/v1/account`
    const queryParams = ``
    let balance = 0
    let staked = 0
    let available = 0
    let rewards = 0
    let delegation = 0
    let undelegation = 0

    try {
      const aRes = await axios.get(`${baseUrl}/balance/${address}`)
      let tmpAvailable = 0

      if (aRes && aRes.data && aRes.data.result) aRes.data.result.forEach(a => {
        tmpAvailable += parseInt(a.amount, 10)
      })

      // convert from 'uatom'
      available = tmpAvailable / DECIMALS[chainId]
    } catch (e) {
      console.log('cosmostation a', e.response.data || e.response, address)
    }

    try {
      const cRes = await axios.get(`${baseUrl}/delegations/${address}`)
      let tmpDelegation = 0
      let tmpRewards = 0

      if (cRes && cRes.data) cRes.data.forEach(r => {
        if (r.balance) tmpDelegation += parseInt(r.balance, 10)

        if (r.delegator_rewards) r.delegator_rewards.forEach(s => {
          tmpRewards += parseFloat(s.amount, 10)
        })
      })

      // convert from 'uatom'
      delegation = tmpDelegation / DECIMALS[chainId]
      rewards = tmpRewards / DECIMALS[chainId]
    } catch (e) {
      console.log('cosmostation b', e.response.data || e.response, address)
    }

    try {
      const dRes = await axios.get(`${baseUrl}/unbonding_delegations/${address}`)
      let tmpUnDelegation = 0

      if (dRes && dRes.data) dRes.data.forEach(d => {
        if (d.entries) d.entries.forEach(e => {
          if (e.balance) tmpUnDelegation += parseInt(e.balance, 10)
        })
      })

      // convert from 'uatom'
      undelegation = tmpUnDelegation / DECIMALS[chainId]
    } catch (e) {
      console.log('cosmostation c', e.response.data || e.response, address)
    }

    // Fun maths! :D
    balance = delegation + undelegation + available
    staked = rewards

    return [{
      address,
      totalUnits: balance,
      totalStaked: delegation,
      totalUnStaked: undelegation,
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
