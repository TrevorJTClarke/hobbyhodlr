const Big = require('big.js')
const { DateTime } = require('luxon')
const { pubsub, EVENTS } = require('../../graphql/subscriptions')
const Mongo = require('../mongo')
const Timeseries = require('../timeseries')
const { getTodayDateMillis } = require('../utils')
const { getFullCache } = require('./cache')
const { getBalanceTotals } = require('./helpers')
const { getUsers } = require('../dataHelpers')

const addTypeSeriesItem = async (type, userId, data, timestamp) => {
  await Timeseries.updateItem({
    timestamp: timestamp || getTodayDateMillis(),
    userId,
    data,
    type,
  })
}

// Calculates total balances for user accounts, stores updates for historical use
const calcAccountHoldings = async userId => {
  const holdings = getFullCache(userId)
  if (!holdings || holdings.length < 0) return

  // update user account balances for faster cache
  if (holdings.length > 0) await addTypeSeriesItem('holdingSeries', userId, holdings)
}

// Calculates total currency amounts for user accounts, stores series for historical use
const triggerAccountTotals = async userId => {
  const holdings = getFullCache(userId)
  if (!holdings || holdings.length < 0) return
  let balanceTotals

  // store accounts totals in DB (on user)
  try {
    // update user account
    balanceTotals = getBalanceTotals(holdings)
    await Mongo.update(Mongo.DBNAMES.user, userId, { _id: userId, totals: balanceTotals })
  } catch (e) {
    throw e
  }

  if (!balanceTotals) return

  // add latest balances to users timeseries data
  await addTypeSeriesItem('balanceSeries', userId, balanceTotals)

  // Trigger realtime event
  pubsub.publish(EVENTS.USER_TOTALS_UPDATED, { updateUserTotals: balanceTotals })
}

// TODO: Finish this!!!!!!!!!!!!!!!!!!!!!!!!!
// // Calculates total currency amounts for user accounts, for each date missing from DB
// // NOTE: This is just for back-filling data, until transactions are tracked!
// const triggerAccountHistoricalTotals = async (
//   userId,
//   start = DateTime.fromISO(DateTime.local().minus({ days: 31 }).toISODate()).toMillis(),
//   end = DateTime.local().toMillis()
// ) => {
//   const holdings = getFullCache(userId)
//   if (!holdings || holdings.length < 0) return Promise.resolve()
//   const startDate = DateTime.fromMillis(start).minus({ days: 1 }).toISODate()
//   const endDate = DateTime.fromMillis(end).toISODate()
//   const totalDays = DateTime.fromISO(endDate).diff(DateTime.fromISO(startDate), 'days').toObject().days
//
//   // Generate the last months worth of dates
//   // Examples: ['1597906800000']
//   const missingDates = []
//
//   // 1. Get historical totals, so we know missing dates needed
//   let historicalTotals = await Timeseries.getTypeSeries(userId, 'balanceSeries')
//   historicalTotals = historicalTotals.map(d => ({ ...d, ...d.data }))
//
//   // Loop to find the missing timestamps
//   const historicalDates = historicalTotals.map(ht => ht.timestamp)
//   for (var i = 0; i < totalDays; i++) {
//     const tmpDate = DateTime.fromISO(DateTime.fromISO(startDate).plus({ days: i }).toISODate()).toMillis()
//     if (!historicalDates.includes(tmpDate)) missingDates.push(tmpDate)
//   }
//
//   // 2. Get historical prices for each account holdings, between start/end date
//   const prices = {
//     // '1597906800000': { btc: '9434.347733118342', ... }
//   }
//   const heldAssetIds = holdings.map(h => h.asset.assetId)
//   try {
//     // Parallel FTW!
//     await Promise.all(heldAssetIds.map(async aId => {
//       // NOTE: This assumes all the historical prices exist for held assets!
//       const assetPrices = await Timeseries.getTypeSeries(null, 'assetSeries', aId)
//       assetPrices.forEach(ap => {
//         prices[ap.timestamp] = prices[ap.timestamp] || {}
//         if (ap.data && ap.data.symbol && ap.data.price) {
//           prices[ap.timestamp][ap.data.symbol] = ap.data.price || '0'
//         }
//       })
//     }))
//   } catch (e) {
//     return Promise.reject('Could not get price for historical asset')
//   }
//
//   // 3. Sum each days totals, store in DB
//   await Promise.all(missingDates.map(async day => {
//     const tmpAccountsForSingleDay = []
//     if (prices[`${day}`] && prices[`${day}`]) {
//       // get holding item for corresponding day
//       await Promise.all(holdings.map(async heldItem => {
//         if (prices[`${day}`][heldItem.asset.symbol]) {
//           let tmpHoldingItems
//
//           // TODO: THIS WILL BREAK!!!!!!!!!!!!!!!
//           if (!heldItem.totalUnitsUSD) tmpHoldingItems = await getAccountBalances(heldItem, heldItem.asset)
//           else tmpHoldingItems = [{
//             ...heldItem,
//             totalUnitsUSD: heldItem.manualUnits
//               ? new Big(heldItem.manualUnits).mul(prices[`${day}`][heldItem.asset.symbol]).toFixed(2)
//               : new Big(heldItem.totalUnits || 0).mul(prices[`${day}`][heldItem.asset.symbol]).toFixed(2)
//           }]
//
//           for (const tmpHoldingItem of tmpHoldingItems) {
//             tmpAccountsForSingleDay.push({ ...tmpHoldingItem, day })
//           }
//         }
//       }))
//     }
//
//     // add historical balance item to users timeseries data
//     const itemTotals = getBalanceTotals(tmpAccountsForSingleDay)
//     const historicalItem = {
//       userId,
//       timestamp: `${day}`,
//       data: itemTotals,
//       type: 'balanceSeries',
//     }
//
//     await Timeseries.upsertItem(historicalItem)
//     historicalTotals.push({ ...historicalItem, ...itemTotals })
//   }))
//
//   // return fully backfilled data
//   return historicalTotals.sort((a, b) => (parseInt(b.timestamp) - parseInt(a.timestamp)))
// }

// Get all users and trigger holdings calc
const triggerCalcAccountTotalsAllUsers = async () => {
  const users = await getUsers()
  if (!users || users.length < 0) return

  try {
    // trigger holdings calc
    for (const user of users) {
      await triggerAccountTotals(`${user._id}`)
    }
  } catch (e) {
    console.log('triggerCalcAccountHoldingsAllUsers', e)
  }
}

module.exports = {
  calcAccountHoldings,
  triggerAccountTotals,
  // triggerAccountHistoricalTotals,
  triggerCalcAccountTotalsAllUsers,
}
