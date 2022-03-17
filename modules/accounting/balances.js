const Mongo = require('../mongo')
const { blockchainProviders, supportedChainSymbols } = require('../blockchains/providerBridge')
const { getAssetBySymbol } = require('../dataHelpers')
const { getFormattedAccountItem } = require('./helpers')

// Return static data, calculating asset price
const getUnsupportedChainBalance = (account, asset) => {
  if (!account || !account.manualUnits) return []
  return [getFormattedAccountItem(account, asset)]
}

// TODO: Support historical balance query!
// First retrieve live blockchain data if any
// Then format for asset and price
const getSupportedChainBalance = async (account, asset) => {
  if (!asset || !asset.symbol) throw 'No asset symbol found!'
  if (!asset.currentPrice) throw 'No asset price found!'
  if (!account || !account.address) throw 'No account address found!'
  const sym = asset.symbol.toLowerCase()
  const providers = await blockchainProviders()
  let balances

  try {
    balances = await providers[sym].getBalances(account.address)
  } catch (e) {
    throw e
  }

  // Supports chains with multiple sub-balance assets (ERC20)
  if (supportedChainSymbols.includes(sym)) {
    // No balances found for account
    if (!balances || balances.length <= 0) return []
    const allBalances = await Promise.all(balances.map(async balance => {
      const isMainAcct = balance.address === account.address && !balance.asset
      const acct = isMainAcct ? { ...account, ...balance } : { ...balance }

      // Get asset context for symbol
      let tmpAsset
      if (isMainAcct) tmpAsset = asset
      if (acct.asset && !acct.asset.assetId) {
        tmpAsset = await getAssetBySymbol(`${acct.asset.symbol}`)
        if (tmpAsset && tmpAsset.assetId) acct.assetId = `${tmpAsset._id}`
        if (!tmpAsset) return null
      }

      return getFormattedAccountItem(acct, { ...balance.asset, ...tmpAsset })
    }))

    return allBalances.filter(a => typeof a !== 'undefined')
  }
}

const getAccountBalances = async (account, asset) => {
  if (!account || !asset) return []
  // Needed to compute supported
  await blockchainProviders()

  let tmpHoldingItems = []
  try {
    if (account.manualUnits) {
      // Manual: calculate holding total based on asset price
      // Supports manual networks as long as we have trade price for asset, this will return null if no price
      tmpHoldingItems = await getUnsupportedChainBalance(account, asset)
    } else if (supportedChainSymbols.includes(asset.symbol)) {
      // Auto: retrieve account totals, calculate total based on asset price
      tmpHoldingItems = await getSupportedChainBalance(account, asset)
    }
  } catch (e) {
    // not sure?!
  }

  return tmpHoldingItems
}

module.exports = {
  getAccountBalances,
}
