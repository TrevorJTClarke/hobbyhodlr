const path = require('path')
require('dotenv').config({ path: path.join(process.cwd(), '/secrets/.env') })
const Engine = require('rules-js')
const priceRules = require('./priceRules.json')
const accountRules = require('./accountRules.json')
const { getAccountHoldings } = require('../accounting')
const messages = require('./messages')
const Mongo = require('../mongo')
const utils = require('../utils')
const slack = require('./slack.js')
const rocketchat = require('./rocketchat.js')

let engine
let initialized = false

// Alerts Engine Logic:
// 1. Rules: Calculate period diffs and confirm new alerts
//    2. get formatted message
//    3. Send alert to configured Notification delivery services

const sendAlert = async (text, settings) => {
  try {
    const active = typeof settings.slackAlertsActive !== 'undefined' ? settings.slackAlertsActive === true : false
    await slack.send({ active, text }, settings)
  } catch (e) {
    console.log('Slack Send:', e, text)
  }
  try {
    const active = typeof settings.rocketchatAlertsActive !== 'undefined' ? settings.rocketchatAlertsActive === true : false
    await rocketchat.send({ active: settings.rocketchatAlertsActive === true, text }, settings)
  } catch (e) {
    console.log('Rocketchat Send:', e, text)
  }
}

const storeAlert = async (type, data) => {
  const alert = {
    timestamp: `${+new Date()}${utils.getRand(1000, 9999)}`,
    type,
    accountId: `${data.account ? data.account._id : ''}` || '',
    assetId: data.asset ? data.asset._id : '',
    userId: data.account ? data.account.userId : '',
    asset: data.asset || {},
    account: data.account || {},
  }

  try {
    await Mongo.add(Mongo.DBNAMES.alert, alert.userId, alert)
  } catch (e) {
    console.log('storeAlert', e)
  }
}

// Filter recent triggered alerts by type
// NOTE: If this gets too chatty, setup exponential backoff with reset?
const checkIfHasRecentAlert = ({ type, time, data, triggeredAlerts }) => {
  if (!triggeredAlerts || !triggeredAlerts.length) return false
  let hasRecentTrigger = false
  const times = {
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
  }
  const timeFrame = time ? times[time] : times.hour

  triggeredAlerts.forEach(t => {
    // Check that there are similar alerts, before determining how recent
    if (
      t.type === type &&
      data.account.userId === t.userId &&
      `${data.account._id}` === t.accountId &&
      data.account.assetId === t.assetId
    ) {
      if (+new Date(Math.round(t.timestamp / 10000)) + timeFrame > +new Date()) hasRecentTrigger = true
    }
  })

  return hasRecentTrigger
}

// ------------------------------------------------
// Trigger Rule Logic
// ------------------------------------------------
const priceAllTimeChange = async data => {
  const active = data.settings && typeof data.settings.priceAthAtl !== 'undefined' ? data.settings.priceAthAtl : false
  if (!active) return false
  const price = parseFloat(data.asset.currentPrice)
  const allTimeLow = parseFloat(data.asset.allTimeLow)
  const allTimeHigh = parseFloat(data.asset.allTimeHigh)
  const threshold = 0.05 // 5% seems to be a good threshold, and mostly filters out stablecoins
  const priceHighFivePercent = allTimeHigh - (allTimeHigh * threshold)
  const priceLowFivePercent = allTimeLow + (allTimeLow * threshold)

  // Check if previously triggered within the last hour
  if (checkIfHasRecentAlert({ type: 'PriceAllTimeChange', time: 'hour', data, triggeredAlerts: data.triggeredAlerts })) return false

  // Filter for missing or wrong data, filter to all time XXX variance!
  if (!allTimeLow || !allTimeHigh) return false
  if (price >= allTimeHigh) return true
  if (price >= priceHighFivePercent) return true
  if (price <= allTimeLow) return true
  if (price <= priceLowFivePercent) return true
  return false
}

const percentChangeTime = async (data, time) => {
  if (!data || !data.settings) return false
  const thresholds = data.settings && typeof data.settings.priceChangeThresholds !== 'undefined' ? JSON.parse(data.settings.priceChangeThresholds) : []
  if (!thresholds.length) return false

  // Check if previously triggered within the last hour
  if (checkIfHasRecentAlert({ type: 'PriceChange', time, data, triggeredAlerts: data.triggeredAlerts })) return false

  // Check if changeInPrice is above threshold (Disregarding positive/negatives)
  // loop thresholds, signalling true at the lowest met threshold
  const changeInPrice = Math.abs(parseFloat(data.asset.changeInPrice))
  const percents = thresholds.map(t => parseInt(t.replace('%', '')))
  if (changeInPrice > Math.min(...percents)) return true
  return false
}

const percentChangeHourly = async data => {
  return percentChangeTime(data, 'hour')
}

const percentChangeDaily = async data => {
  return percentChangeTime(data, 'day')
}

const percentChangeRare = async data => {
  if (!data || !data.settings) return false
  const active = data.settings && typeof data.settings.priceChangeRare !== 'undefined' ? data.settings.priceChangeRare : false
  if (!active) return false
  const thresholds = data.settings && typeof data.settings.priceChangeThresholds !== 'undefined' ? JSON.parse(data.settings.priceChangeThresholds) : []
  if (!thresholds.length) return false

  // Check if previously triggered within the last hour
  if (checkIfHasRecentAlert({ type: 'PriceChangeRare', time: 'hour', data, triggeredAlerts: data.triggeredAlerts })) return false

  // Check if changeInPrice is above threshold (Disregarding positive/negatives)
  // loop thresholds, signalling true at the lowest met threshold
  const changeInPrice = Math.abs(parseFloat(data.asset.changeInPrice))
  const percents = thresholds.map(t => {
    const p = parseInt(t.replace('%', ''))
    return p * p
  })
  if (changeInPrice > Math.min(...percents)) return true
  return false
}

// Check if holdings balance is less than user settings threshold
const balanceBelowThreshold = async data => {
  if (!data || !data.settings) return false
  const hld = data.holding || {}
  const units = hld.manualUnits ? parseFloat(hld.manualUnits) : parseFloat(hld.totalUnits) || 0
  const price = parseFloat(data.asset.currentPrice)
  const threshold = data.settings && typeof data.settings.accountBalanceLow !== 'undefined' ? parseInt(data.settings.accountBalanceLow) : 100
  if (threshold === 0) return false

  // Check if previously triggered within the last hour
  if (checkIfHasRecentAlert({ type: 'BalanceLow', time: 'hour', data, triggeredAlerts: data.triggeredAlerts })) return false

  // Filter for missing or wrong data
  if (!units || !price) return false
  if (units * price > threshold) return false
  return true
}

// Get last balance, check if this balance movement is more than 20%
// Disregard new accounts, and small movements
const balanceLargeMovement = async data => {
  if (!data || !data.settings) return false
  const active = data.settings && typeof data.settings.accountBalanceLargeSum !== 'undefined' ? data.settings.accountBalanceLargeSum : false
  if (!active) return false
  if (!data.triggeredAlerts || data.triggeredAlerts.length <= 0) return false

  // Check if previously triggered within the last hour
  if (checkIfHasRecentAlert({ type: 'BalanceLargeMovement', time: 'hour', data, triggeredAlerts: data.triggeredAlerts })) {
    // Store previous if NO found
    await storeAlert('BalanceLargeMovement', data)
    return false
  }

  // Check triggered alerts for matching type, accountId & latest timestamp
  let previousAccount
  let previousTs

  data.triggeredAlerts.forEach(ta => {
    if (ta.type === 'BalanceLargeMovement' && ta.accountId === `${data.account._id}`) {
      if (!previousAccount) {
        previousAccount = ta.account
        previousTs = ta.timestamp
      } else if (previousTs < ta.timestamp) {
        previousAccount = ta.account
        previousTs = ta.timestamp
      }
    }
  })

  if (!previousAccount) return false
  const prevAmt = parseFloat(previousAccount.manualUnits || previousAccount.totalUnits)
  const currentAmt = parseFloat(data.holding.manualUnits || data.holding.totalUnits)

  // is more than 20%
  if (Math.abs(utils.getPercentChange(prevAmt, currentAmt)) > 20) return true
  return false
}

// Checks that an account reward exceeds user defined threshold
const balanceReward = async data => {
  if (!data) return false
  if (!data.settings) return false
  const threshold = data.settings && typeof data.settings.accountRewardBalance !== 'undefined' ? parseInt(data.settings.accountRewardBalance) : 100
  if (threshold === 0) return false
  if (!data.holding) return false
  if (data.account.totalPendingRewards === undefined) return false
  const units = parseFloat(data.holding.totalPendingRewards || 0)
  const price = parseFloat(data.asset.currentPrice)

  // Check if previously triggered within the last day
  if (checkIfHasRecentAlert({ type: 'BalanceRewards', time: 'day', data, triggeredAlerts: data.triggeredAlerts })) return false

  // Filter for missing or wrong data
  if (!units || !price) return false
  if (units * price > threshold) return false
  return true
}

// ------------------------------------------------
// Notifications
// Triggers confirmed we should alert on this data, format message and trigger delivery integrations
// ------------------------------------------------

// Triggers for price change on an asset when it exceeds user defined thresholds for 1 hour
const alertPricePercent = async data => {
  let previousAsset = {}
  data.triggeredAlerts.forEach(a => {
    if (
      a.assetId === data.asset._id &&
      a.accountId === data.account.userId &&
      a.userId === data.account.userId
    ) previousAsset = a
  })

  data.asset.previousPrice = previousAsset.asset ? previousAsset.asset.currentPrice : null

  // NOTE: Needs to check if triggered timestamp is greater than 1 hr
  data.settings.timeFrame = 'hour'
  if (previousAsset.timestamp > (+new Date() - 1 * 60 * 60 * 1000)) data.settings.timeFrame = 'day'
  if (previousAsset.timestamp > (+new Date() - 24 * 60 * 60 * 1000)) data.settings.timeFrame = 'week'

  const message = messages.priceChange(data, data.settings)
  if (!message) return
  await storeAlert('PriceChange', data)
  await sendAlert(message, data.settings)
}

// Triggers for price change on an asset when it exceeds user defined thresholds for 1 hour
const alertPricePercentHourly = async data => {
  await alertPricePercent(data)
}

// Triggers for price change on an asset when it exceeds user defined thresholds for 1 day
const alertPricePercentDaily = async data => {
  await alertPricePercent(data)
}

// Triggers for price change on an asset when it exceeds user defined thresholds
const alertPricePercentRare = async data => {
  await alertPricePercent(data)
}

// Triggers when an asset price is within 10% of ATH or ATL
const alertPriceAllTimeChange = async data => {
  const message = messages.priceAllTimeChange(data, data.settings)
  if (!message) return
  await storeAlert('PriceAllTimeChange', data)
  await sendAlert(message, data.settings)
}

// Triggered if balance is below settings threshold
const alertBalanceLow = async (data, context) => {
  const message = messages.lowBalance(data, data.settings)
  if (!message) return
  await storeAlert('BalanceLow', data)
  await sendAlert(message, data.settings)
}

// Triggers when balance change is greater than 20% change
const alertBalanceLargeMovement = async data => {
  // Check triggered alerts for matching type, accountId & latest timestamp
  let accountPrevious
  let previousTs

  data.triggeredAlerts.forEach(ta => {
    if (ta.type === 'BalanceLargeMovement' && ta.accountId === `${data.account._id}`) {
      if (!previousAccount) {
        accountPrevious = ta.account
        previousTs = ta.timestamp
      } else if (previousTs < ta.timestamp) {
        accountPrevious = ta.account
        previousTs = ta.timestamp
      }
    }
  })

  if (!accountPrevious) return
  data.accountPrevious = accountPrevious
  const message = messages.largeBalanceMovement(data, data.settings)
  if (!message) return
  await storeAlert('BalanceLargeMovement', data)
  await sendAlert(message, data.settings)
}

// Triggers when an account reward exceeds user defined threshold
const alertBalanceReward = async data => {
  const message = messages.rewards(data, data.settings)
  if (!message) return
  await storeAlert('BalanceRewards', data)
  await sendAlert(message, data.settings)
}

// evaluate facts using the engine
// REF: https://github.com/bluealba/rules-js
module.exports = {
  initialize: () => {
    engine = new Engine()

    // Logical triggers
    engine.closures.add('priceAllTimeChange', priceAllTimeChange)
    engine.closures.add('percentChangeHourly', percentChangeHourly)
    engine.closures.add('percentChangeDaily', percentChangeDaily)
    engine.closures.add('percentChangeRare', percentChangeRare)
    engine.closures.add('balanceBelowThreshold', balanceBelowThreshold)
    engine.closures.add('balanceLargeMovement', balanceLargeMovement)
    engine.closures.add('balanceReward', balanceReward)

    // Outcomes
    engine.closures.add('alertPriceAllTimeChange', alertPriceAllTimeChange)
    engine.closures.add('alertPricePercentHourly', alertPricePercentHourly)
    engine.closures.add('alertPricePercentDaily', alertPricePercentDaily)
    engine.closures.add('alertPricePercentRare', alertPricePercentRare)
    engine.closures.add('alertBalanceLow', alertBalanceLow)
    engine.closures.add('alertBalanceLargeMovement', alertBalanceLargeMovement)
    engine.closures.add('alertBalanceReward', alertBalanceReward)

    engine.add(priceRules)
    engine.add(accountRules)
    initialized = true
  },
  priceAlerts: async ({ settings, triggeredAlerts, priceAssets }) => {
    if (!initialized) return

    // Loop all assets then process alerts to trigger
    await Promise.all(Object.keys(priceAssets).map(async k => {
      await engine.process('price-rules', {
        asset: priceAssets[k],
        settings,
        triggeredAlerts,
      })
    }))
  },
  accountAlerts: async ({ settings, userAccounts, userHoldings, triggeredAlerts, priceAssets }) => {
    if (!initialized) return

    // Loop all assets then process alerts to trigger
    await Promise.all(userAccounts.map(async account => {
      let asset
      let holding
      priceAssets.forEach(p => { if (`${p._id}` === account.assetId) asset = p })
      if (!asset) return Promise.resolve()
      if (userHoldings) userHoldings.forEach(h => { if (h.assetId === account.assetId) holding = h })

      await engine.process('account-rules', {
        asset,
        account,
        holding,
        settings,
        triggeredAlerts,
      })
    }))
  },
}
