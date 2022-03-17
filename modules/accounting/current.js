const Big = require('big.js')
const { getUsers, getUserAccounts } = require('../dataHelpers')
const { getAssetsForAccounts, getAssetForAccount } = require('./helpers')
const { getFullCache, setCacheItem } = require('./cache')
const { getAccountBalances } = require('./balances')

const totalFields = ['manualUnits', 'totalUnits', 'totalUnitsUSD']

const getAccountHoldings = async (userId) => {
  // Immediately check if cache has anything, and return
  const cache = getFullCache(userId)
  if (cache) return cache

  // check if we have any accounts at all
  // if so return array so we know its processing
  // trigger the processor
  const hasAccounts = await getUserAccounts()
  if (hasAccounts.length) {
    triggerCalcAccountHoldings(userId)
    return []
  }

  throw 'No accounts'
}

// Returns last calculated account totals
const triggerCalcAccountHoldings = async (userId) => {
  if (!userId) throw 'User ID Required!'

  // Go to checking real balances
  const accounts = await getUserAccounts()
  if (!accounts.length) return []

  // quick cache of asset price data
  const assets = await getAssetsForAccounts(userId, accounts)

  try {
    // loop accounts to process price * balance
    for (const idx in accounts) {
      const asset = assets[accounts[idx].assetId]
      const account = accounts[idx]
      // retrieve data from the blockchain or external account service
      const tmpHoldingItems = await getAccountBalances(account, asset)

      for (const tmpHoldingItem of tmpHoldingItems) {
        if (tmpHoldingItem) {
          if (tmpHoldingItem.assetId && !tmpHoldingItem.asset) {
            tmpHoldingItem.asset = await getAssetForAccount({ userId, assetId: tmpHoldingItem.assetId })
          }
          setCacheItem(userId, tmpHoldingItem._id, tmpHoldingItem)
        }
      }
    }
  } catch (e) {
    throw e
  }
}

// Get all users and trigger holdings calc
const triggerCalcAccountHoldingsAllUsers = async () => {
  const users = await getUsers()
  if (!users || users.length < 0) return

  try {
    // trigger holdings calc
    for (const user of users) {
      await triggerCalcAccountHoldings(`${user._id}`)
    }
  } catch (e) {
    console.log('triggerCalcAccountHoldingsAllUsers', e)
  }
}

module.exports = {
  getAccountHoldings,
  triggerCalcAccountHoldings,
  triggerCalcAccountHoldingsAllUsers,
}
