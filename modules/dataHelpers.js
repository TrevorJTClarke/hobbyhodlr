const utils = require('./utils')
const Mongo = require('./mongo')

// Returns list of previously triggered alerts
const getAlerts = async (userId, startAt, endAt) => {
  if (!userId) throw 'User ID missing!'
  let res

  const filters = { userId: `${userId}` }
  if (startAt || endAt) filters.timestamp = {}
  if (startAt) filters.timestamp['$gt'] = startAt
  if (endAt) filters.timestamp['$lt'] = endAt

  try {
    res = await Mongo.find(Mongo.DBNAMES.alert, userId, filters)
  } catch (e) {
    console.log('getAlerts', e)
  }

  return res || []
}

// returns per-user alert settings
const getAlertSettings = async userId => {
  if (!userId) throw 'User ID missing!'
  let res

  try {
    res = await Mongo.get(Mongo.DBNAMES.user, userId, Mongo.ObjectId(userId))
  } catch (e) {
    console.log('getAlertSettings', e)
  }

  delete res.passcode
  delete res.salt

  return res || {}
}

const getAdminSettings = async () => {
  let res

  try {
    res = await Mongo.find(Mongo.DBNAMES.admin, null, {})
  } catch (e) {
    console.log('getAdminSettings', e)
  }

  const settings = res && res.length > 0 ? res[0] : {}
  return settings
}

const getAllSettingsByUser = async userId => {
  const user = await getAlertSettings(userId)
  const admin = await getAdminSettings(userId)

  return { ...user, ...admin }
}

// Support multiple users! YAY!
const getUsers = async () => {
  let users
  try {
    users = await Mongo.find(Mongo.DBNAMES.user, null, {})
  } catch (e) {
    console.log('no user', e)
    return []
  }

  return users || []
}

// returns per-user active assets
const getUserUniqueAssetIds = async (userId, includeGoals, includeAccounts) => {
  const assetList = []
  let goals = [], accounts = []

  if (includeGoals !== false) {
    try {
      goals = await Mongo.find(Mongo.DBNAMES.goal, userId, {})
      if (goals && goals.length > 0) goals.forEach(g => assetList.push(g.assetId))
    } catch (e) {
      console.log('no goals', e)
    }
  }

  if (includeAccounts !== false) {
    try {
      accounts = await Mongo.find(Mongo.DBNAMES.account, userId, {})
      if (accounts && accounts.length > 0) {
        accounts.forEach(a => {
          let has = false
          if (goals.length) {
            goals.forEach(g => {
              if (g.assetId === a) has = true
            })
          }
          if (!has) assetList.push(a.assetId)
        })
      }
    } catch (e) {
      // console.log('no accounts', e)
    }
  }

  return assetList
}

// returns per-user active assets
const getUserAccounts = async userId => {
  let accounts = []

  try {
    accounts = await Mongo.find(Mongo.DBNAMES.account, userId, {})
  } catch (e) {
    // console.log('no accounts', e)
  }

  return accounts
}

const getAssetBySymbol = async symbol => {
  if (!symbol) return

  try {
    // retrieve asset data for each account
    return Mongo.get(Mongo.DBNAMES.asset, null, { symbol: `${symbol}`.toLowerCase() })
  } catch (e) {
    // soft fail
  }
}

// returns per-user active assets
const getPriceAssets = async assetIds => {
  if (!assetIds || assetIds.length <= 0) throw 'Asset IDs required to get price assets'
  const assets = []

  try {
    for (const assetId of assetIds) {
      const foundAssets = await Mongo.find(Mongo.DBNAMES.asset, null, Mongo.ObjectId(assetId))
      foundAssets.forEach(asset => assets.push(asset))
    }
  } catch (e) {
    console.log('getPriceAssets', e)
  }

  return assets
}

module.exports = {
  getAllSettingsByUser,
  getAdminSettings,
  getAlerts,
  getAlertSettings,
  getAssetBySymbol,
  getPriceAssets,
  getUsers,
  getUserUniqueAssetIds,
  getUserAccounts,
}
