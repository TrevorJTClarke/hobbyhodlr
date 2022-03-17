const bs58 = require('bs58')
const BigNumber = require('bignumber.js')
const { query } = require('../blockchains/jsonRpc')
const { DECIMALS } = require('../blockchains/constants')

const baseUrl = `https://rpc.mainnet.near.org`
const config = { baseUrl }

// https://rpc.mainnet.near.org
const supportedChains = {
  near: 'near',
}

// Public RPC doesnt need key validation
const isSupported = () => true

// get staked balance for an account ID
const getPoolsData = async () => {
  const method = 'validators'
  const params = [null]
  
  try {
    const data = await query({ config, method, params })
    if (data && data.current_validators) return data.current_validators.map(i => i.account_id)
    return []
  } catch (e) {
    // throw e
  }
}

// get staked balance for an account ID
const getStakedBalanceByAccountId = async (pools, accountId) => {
  const method = 'query'
  const encodedData = bs58.encode(Buffer.from(JSON.stringify({ account_id: accountId })))
  let totalStaked = '0'

  for (const pool of pools) {
    const params = [`call/${pool}/get_account_total_balance`, `${encodedData}`]
    const data = await query({ config, method, params })

    if (data.result && Array.isArray(data.result)) {
      // crazy string handling needed i guess
      const staked = `${await Buffer.from(data.result).toString()}`.replace(/\"/g, '')
      if (staked.length > 1) {
        totalStaked = new BigNumber(staked).dividedBy(DECIMALS['near']).plus(totalStaked).toString()
      }
    }
  }

  return totalStaked
}

function getBalances(chainId) {
  if (!chainId) throw 'No chainId supplied'
  return async function(address, settings) {
    if (!address) throw 'No address supplied'
    const bId = supportedChains[chainId]
    const accounts = []
    const method = 'query'
    const params = [`account/${address}`, '']
    const pools = await getPoolsData()
    let totalUnits = '0'
    let totalStaked = '0'

    // get staked balances!
    if (pools && pools.length > 0) {
      try {
        const stake = await getStakedBalanceByAccountId(pools, address)
        if (stake) totalStaked = stake
      } catch (e) {
        console.log(`near.${chainId}.getStakedBalanceByAccountId()`, `${e}`.substring(0, 100), address)
        // throw e
      }
    }
    console.log(address, totalStaked);

    try {
      const data = await query({ config, method, params })

      if (data) {
        // get main balance, Change to correct decimals
        if (data.amount) totalUnits = new BigNumber(`${data.amount}`).dividedBy(DECIMALS[chainId]).valueOf()
        // if (data.locked) {
        //   const totalLocked = new BigNumber(data.locked).div(DECIMALS[chainId]).valueOf()
        //   totalStaked = new BigNumber(totalStaked).plus(totalLocked).div(DECIMALS[chainId]).valueOf()
        // }
        if (totalStaked) totalUnits = new BigNumber(totalStaked).plus(totalUnits).valueOf()
        accounts.push({ address, totalUnits, totalStaked })
      }
    } catch (e) {
      console.log(`near.${chainId}.getBalances()`, `${e}`.substring(0, 100), address)
      throw e
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
