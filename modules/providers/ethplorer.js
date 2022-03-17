const axios = require('axios')
const { DECIMALS } = require('../blockchains/constants')

const supportedChains = {
  eth: true,
}

// all api requests need API key
const isSupported = () => true

function getBalances(chainId) {
  if (!chainId || !supportedChains[chainId]) throw 'No chainId supplied'
  return async function(address, settings) {
    if (!address) throw 'No address supplied'
    const baseUrl = `https://api.ethplorer.io/getAddressInfo`
    const queryParams = `?apiKey=${settings.ethplorerId || 'freekey'}`
    const accounts = []

    try {
      const { data } = await axios.get(`${baseUrl}/${address}${queryParams}`)
      if (data && data.ETH) {
        // get main ETH balance
        const totalUnits = data.ETH && typeof data.ETH.balance !== 'undefined' ? data.ETH.balance : 0
        accounts.push({ address, totalUnits })
      }

      // get ERC balances
      if (data.tokens && data.tokens.length > 0) {
        for (const erc of data.tokens) {
          const totalUnits = parseFloat(erc.balance) / `1e${erc.tokenInfo.decimals || 0}`
          if (totalUnits > 0) accounts.push({
            totalUnits,
            specs: ['erc20'],
            type: 'cryptocurrency',
            address: erc.tokenInfo.address,
            asset: {
              address: erc.tokenInfo.address,
              name: erc.tokenInfo.name,
              symbol: erc.tokenInfo.symbol,
              decimals: erc.tokenInfo.decimals || 0,
            },
          })
        }
      }
    } catch (e) {
      console.log(`ethplorer.${chainId}.getBalances()`, `${e}`.substring(0, 100), address)
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
