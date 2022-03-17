const Big = require('big.js')
const { DateTime } = require('luxon')
const Mongo = require('../mongo')

const totalFields = ['manualUnits', 'totalUnits', 'totalUnitsUSD', 'totalStaked', 'totalStakedUSD', 'totalPendingRewards', 'totalPendingRewardsUSD']
const BASE_TOTALS = {
  networth: '0',
  cash: '0',
  traditional: '0',
  transactions: '0',
  crypto: '0',
  interest: '0',
  interestPending: '0',
  dividends: '0',
  lending: '0',
}

// Fixes data needed for account lists
const getFormattedAccountData = async item => {
  if (!item.assetId) return item
  try {
    if (!item.asset) item.asset = await Mongo.get('asset', null, Mongo.ObjectId(item.assetId))
    item.dataType = 'account'
    return item
  } catch (e) {
    throw e
  }
}

// Returns an account item with calculated price data
const getFormattedAccountItem = (account, asset) => {
  const usdPrice = asset && asset.currentPrice ? asset.currentPrice : account.asset && account.asset.currentPrice ? account.asset.currentPrice : 0
  const balances = {}

  // totalUnits is always denoted at base level, if an asset has 8 decimal places
  // division or multiplication is handled here for data consistency
  // NOTE: For less confusion, when manualUnits is present, totalUnits is left blank but totalUnitsUSD is calculated
  let totalUnits = 0
  if (account.totalUnits) balances.totalUnitsUSD = new Big(account.totalUnits).times(usdPrice).toFixed(2).valueOf()
  if (account.manualUnits) balances.totalUnitsUSD = new Big(account.manualUnits).times(usdPrice).toFixed(2).valueOf()

  // Staking is only possible for supported chain assets, only add data when present
  if (account.totalStaked) {
    balances.totalStaked = account.totalStaked
    balances.totalStakedUSD = new Big(account.totalStaked).times(usdPrice).toFixed(2).valueOf()
  }
  if (account.totalPendingRewards) {
    balances.totalPendingRewards = account.totalPendingRewards
    balances.totalPendingRewardsUSD = new Big(account.totalPendingRewards).times(usdPrice).toFixed(2).valueOf()
  }

  return {
    ...account,
    asset,
    ...balances,
  }
}

// Totals all account balances by types
const getBalanceTotals = accounts => {
  const updatedAt = `${DateTime.local().toMillis()}`
  let networth = 0
  let cash = 0
  let traditional = 0
  let transactions = 0
  let crypto = 0
  let interest = 0
  let interestPending = 0
  let dividends = 0
  let lending = 0

  // no accounts, return 0s on all
  if (!accounts || accounts.length <= 0) {
    return { updatedAt, networth: '0.00', cash: '0.00', traditional: '0.00', transactions: '0.00', crypto: '0.00', interest: '0.00', interestPending: '0.00', dividends: '0.00', lending: '0.00' }
  }

  accounts.forEach(a => {
    if (a.totalUnitsUSD) networth = new Big(a.totalUnitsUSD).plus(networth)
    if (a.totalUnitsUSD && a.type === 'cryptocurrency') crypto = new Big(a.totalUnitsUSD).plus(crypto)
    if (a.totalUnitsUSD && a.type === 'cryptocurrency' && a.subtype === 'stablecoin') cash = new Big(a.totalUnitsUSD).plus(cash)
    if (a.totalUnitsUSD && a.type === 'security') traditional = new Big(a.totalUnitsUSD).plus(traditional)
    if (a.totalStakedUSD) interest = new Big(a.totalStakedUSD).plus(interest)
    if (a.totalPendingRewardsUSD) interestPending = new Big(a.totalPendingRewardsUSD).plus(interestPending)
  })

  return {
    updatedAt,
    networth: networth.toFixed(2).valueOf(),
    cash: cash.toFixed(2).valueOf(),
    traditional: traditional.toFixed(2).valueOf(),
    transactions: new Big(transactions).toFixed(2).valueOf(),
    crypto: crypto.toFixed(2).valueOf(),
    interest: interest.toFixed(2).valueOf(),
    interestPending: interestPending.toFixed(2).valueOf(),
    dividends: dividends.toFixed(2).valueOf(),
    lending: lending.toFixed(2).valueOf(),
  }
}

const getAssetForAccount = async ({ userId, _id }) => {
  if (!_id) return

  try {
    // retrieve asset data for each account
    return Mongo.get(Mongo.DBNAMES.asset, userId,  Mongo.ObjectId(_id))
  } catch (e) {
    // soft fail
  }
}

const getAssetsForAccounts = async (userId, accounts) => {
  const assets = {}
  if (!accounts || accounts.length <= 0) return assets

  try {
    // retrieve asset data for each account
    await Promise.all(accounts.map(async account => {
      // Retrieve DB asset, only if not already cached
      if (account.assetId) {
        const asset = await getAssetForAccount({ userId, _id: account.assetId })
        if (asset && !assets[account.assetId]) assets[`${asset._id}`] = asset
      }
    }))
  } catch (e) {
    // soft fail
  }

  return assets
}

// Dedupe account id
const uniqueTotals = items => {
  if (!items || !items.length) return []
  const m = new Map()

  items.forEach(i => {
    const e = m.has(i.assetId) ? m.get(i.assetId) : {}
    const f = { ...e }

    Object.keys(i).forEach(k => {
      const d = i[k]

      if (totalFields.includes(k)) {
        if (f[k] !== undefined && i[k] !== undefined) f[k] = new Big(f[k]).plus(i[k]).valueOf()
        else if (i[k] !== undefined) f[k] = new Big(i[k]).valueOf()
      } else {
        f[k] = i[k]
      }
    })

    if (f.assetId) m.set(f.assetId, f)
  })

  return Array.from(m.values())
}

module.exports = {
  BASE_TOTALS,
  uniqueTotals,
  getFormattedAccountData,
  getFormattedAccountItem,
  getBalanceTotals,
  getAssetForAccount,
  getAssetsForAccounts,
}
