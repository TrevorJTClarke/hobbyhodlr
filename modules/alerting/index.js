const path = require('path')
require('dotenv').config({ path: path.join(process.cwd(), '/secrets/.env') })
const dataHelpers = require('../dataHelpers')
const { getFullCache } = require('../accounting')
const rules = require('./rules')

// Alerts Engine Logic:
// 1. Get all users
//   2. Get settings
//   3. Get previous alerts data
//   4. Rules: Calculate period diffs and confirm new alerts
//      5. get formatted message
//      6. Send alert to configured Notification delivery services

const methods = {
  init: rules.initialize,
  runAllUsersPriceAlerts: async () => {
    const users = await dataHelpers.getUsers()

    for (const user of users) {
      const userId = user._id
      const settings = await dataHelpers.getAllSettingsByUser(userId)
      const triggeredAlerts = await dataHelpers.getAlerts(userId)
      const priceAssetIds = await dataHelpers.getUserUniqueAssetIds(userId)
      const priceAssets = await dataHelpers.getPriceAssets(priceAssetIds || [])

      // Let the rules engine take this known data and compute triggered messages
      rules.priceAlerts({ settings, triggeredAlerts, priceAssets })
    }
  },
  runAllUsersAccountAlerts: async () => {
    const users = await dataHelpers.getUsers()

    for (const user of users) {
      const userId = user._id
      const userHoldings = getFullCache(userId)
      const settings = await dataHelpers.getAllSettingsByUser(userId)
      const userAccounts = await dataHelpers.getUserAccounts(userId)
      const triggeredAlerts = await dataHelpers.getAlerts(userId)
      const priceAssetIds = await dataHelpers.getUserUniqueAssetIds(userId)
      const priceAssets = await dataHelpers.getPriceAssets(priceAssetIds || [])

      // Let the rules engine take this known data and compute triggered messages
      rules.accountAlerts({ settings, userAccounts, userHoldings, triggeredAlerts, priceAssets })
    }
  },
}

module.exports = methods
