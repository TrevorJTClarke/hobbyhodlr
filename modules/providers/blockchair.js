const axios = require('axios')
const { DECIMALS } = require('../blockchains/constants')

// TODO: Assess Ripple, EOS, Tezos, Stellar, Monero, Doge, Mixin, Groestlcoin
// https://blockchair.com/
// https://api.blockchair.com/{:btc_chain}/dashboards/address/{:address}
//
// Special endpoints:
// https://api.blockchair.com/cardano/raw/address/{:address}
const supportedChains = {
  ada: 'cardano', // getting 404s
  bch: 'bitcoin-cash',
  bsv: 'bitcoin-sv',
  btc: 'bitcoin',
  eth: 'ethereum',
  ltc: 'litecoin',
  zec: 'zcash',
}

// Free API doesnt need key validation
const isSupported = () => true

function getBalances(chainId) {
  if (!chainId) throw 'No chainId supplied'
  return async function(address, settings) {
    if (!address) throw 'No address supplied'
    const bId = supportedChains[chainId]
    const baseUrl = `https://api.blockchair.com/`
    const extendedUrl = chainId === 'ada' ? `raw/address` : `dashboards/address`
    const apiKey = settings.blockchairId ? '?key=' + settings.blockchairId : ''
    const queryParams = chainId === 'eth' ? `${apiKey ? apiKey + '&' : '?'}erc_20=true` : `${apiKey}`
    const accounts = []
    const url = `${baseUrl}${bId}/${extendedUrl}/${address}${queryParams}`

    try {
      const { data } = await axios.get(url)
      if (data && data.data) {
        const res = data && data.data && data.data[address] ? data.data[address] : {}

        // get main balance
        if (res.address && res.address.balance && res.address.balance) {
          accounts.push({
            address,
            // Change to correct decimals
            totalUnits: parseFloat(res.address.balance) / DECIMALS[chainId],
          })
        }

        // Handle special cardano raw balances
        if (res.address && res.address.caBalance && res.address.caBalance.getCoin) {
          accounts.push({
            address,
            // Change to correct decimals
            totalUnits: parseFloat(res.address.caBalance.getCoin) / DECIMALS[chainId],
          })
        }

        // get ERC balances
        if (res.layer_2 && res.layer_2.erc_20 && res.layer_2.erc_20.length > 0) {
          for (const erc of res.layer_2.erc_20) {
            const totalUnits = parseFloat(erc.balance) / `1e${erc.token_decimals || 0}`
            if (totalUnits > 0) accounts.push({
              totalUnits,
              specs: ['erc20'],
              type: 'cryptocurrency',
              address: erc.token_address,
              asset: {
                address: erc.token_address,
                name: erc.token_name,
                symbol: erc.token_symbol,
                decimals: erc.token_decimals || 0,
              },
            })
            console.log('res.layer_2.erc_20', res.layer_2.erc_20)
          }
        }
      }
    } catch (e) {
      console.log(`blockchair.${chainId}.getBalances()`, `${e}`.substring(0, 100), address)
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
