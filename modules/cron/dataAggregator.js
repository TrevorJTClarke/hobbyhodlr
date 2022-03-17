const path = require('path')
require('dotenv').config({ path: path.join(process.cwd(), '/secrets/.env') })
const { getAllAssetsRanking, getUsersAssetPrices, getAssetPricesHistorical } = require('./pricefeed')
const { triggerCalcAccountHoldingsAllUsers, triggerCalcAccountTotalsAllUsers } = require('../accounting')
const alerts = require('../alerting')
const dataHelpers = require('../dataHelpers')
const utils = require('../utils')

const MINUTE = 60 * 1000

const asyncSetTimeout = async ms => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const pollUntil = async (fn, delay, offset = 10) => {
  let cancelled = false
  const pollRecursive = async () => {
    if (cancelled) return
    fn()
    await asyncSetTimeout(delay)
    pollRecursive()
  }

  setTimeout(() => {
    const p = pollRecursive()
    p.cancel = () => (cancelled = true)
  }, offset)
}

// Responsible for checking data every X time, loading from different sources and aggregating them
class DataAggregator {
  constructor(id) {
    return this
  }

  async start() {
    // Get admin settings
    const settings = await dataHelpers.getAdminSettings()

    // Initialize alert engine settings
    alerts.init()

    // start polling loop, with config
    const dataPollMins = utils.getSafePollingInt(parseInt(settings.dataPollingInterval) * MINUTE || 5 * MINUTE)
    pollUntil(this.userPrices, dataPollMins)
    pollUntil(this.standardPrices, utils.getSafePollingInt(30 * MINUTE), 5 * MINUTE)

    // Users account history
    pollUntil(this.userHoldings, utils.getSafePollingInt(60 * MINUTE), 1 * MINUTE)
    pollUntil(this.userTotals, dataPollMins, 2 * MINUTE)

    // TESTING::::::::::
    // getAssetPricesHistorical()

    // process alerts every hour
    const priceAlertMins = utils.getSafePollingInt(parseInt(settings.alertCheckPriceInterval) * MINUTE || 5 * MINUTE)
    const accountAlertMins = utils.getSafePollingInt(parseInt(settings.alertCheckAccountInterval) * MINUTE || 60 * MINUTE)
    pollUntil(this.runAllUsersPriceAlerts, priceAlertMins, 4 * MINUTE)
    pollUntil(this.runAllUsersAccountAlerts, accountAlertMins, 4 * MINUTE)
  }

  standardPrices() {
    getAllAssetsRanking()
  }

  userPrices() {
    getUsersAssetPrices()
  }

  userHoldings() {
    triggerCalcAccountHoldingsAllUsers()
  }

  userTotals() {
    triggerCalcAccountTotalsAllUsers()
  }

  runAllUsersPriceAlerts() {
    alerts.runAllUsersPriceAlerts()
  }

  runAllUsersAccountAlerts() {
    alerts.runAllUsersAccountAlerts()
  }

  stop() {
    pollUntil.cancel()
  }
}

module.exports = new DataAggregator()
