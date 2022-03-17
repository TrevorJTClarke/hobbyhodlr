const axios = require('axios')
const { DECIMALS } = require('../blockchains/constants')

const supportedChains = {
  bch: 'bitcoin-cash-mainnet',
  bsv: 'bitcoin-sv-mainnet',
  btc: 'bitcoin-mainnet',
  eth: 'ethereum-mainnet',
  ltc: 'litecoin-mainnet',
  zec: 'zcash-mainnet',
}

// all api requests need API key
const isSupported = settings => {
  return settings && settings.amberdataId
}

function getBalances(chainId) {
  if (!chainId || !supportedChains[chainId]) return Promise.reject('No chainId supplied')
  return async function(address, settings) {
    if (!address) return Promise.reject('No address supplied')
    const baseUrl = `https://web3api.io/api/v2/addresses/${address}/balances`
    const queryParams = '?includePrice=true'
    const options = {
      headers: {
        'x-api-key': settings.amberdataId,
        'x-amberdata-blockchain-id': supportedChains[chainId],
      }
    }
    const accounts = []

    try {
      const { data } = await axios.get(`${baseUrl}${queryParams}`, options)
      if (data && data.payload) {
        const res = data && data.payload ? data.payload : {}

        // get main balance
        if (res.balance) {
          accounts.push({
            type: 'cryptocurrency',
            address,
            totalUnits: parseFloat(res.balance) / DECIMALS[chainId],
          })
        }

        // get ERC balances
        if (res.tokens && res.tokens.length > 0) {
          for (const erc of res.tokens) {
            const totalUnits = parseFloat(erc.amount) / `1e${erc.decimals || 0}`
            if (totalUnits > 0) accounts.push({
              totalUnits,
              type: 'cryptocurrency',
              address,
              asset: {
                address: erc.address,
                name: erc.name,
                symbol: erc.symbol,
                decimals: erc.decimals || 0,
              },
            })
          }
        }
      }
    } catch (e) {
      console.log(`amberdata.${chainId}.getBalances()`, `${e}`.substring(0, 100), address)
      throw e.response || e
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
