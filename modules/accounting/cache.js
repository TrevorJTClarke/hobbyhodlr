const { pubsub, EVENTS } = require('../../graphql/subscriptions')
const Mongo = require('../mongo')
const { getUsers } = require('../dataHelpers')

const accountCache = {}

const getCacheItem = (userId, key) => {
  if (!accountCache[userId]) return
  return accountCache[userId].get(key)
}

const hasExpired = userId => {
  const expires = getCacheItem(userId, 'expires')
  if (!expires) return true
  return +new Date() > expires
}

const getFullCache = userId => {
  if (hasExpired(userId)) return
  if (!accountCache[userId] || !accountCache[userId].size) return
  return Array.from(accountCache[userId].values()).filter(f => typeof f !== 'number')
}

const setCacheItem = async (userId, key, data, skipUpdate) => {
  if (!accountCache[userId]) accountCache[userId] = new Map()
  let res
  if (!data || !data.assetId) return
  if (data.assetId.length > 24) return

  try {
    res = await Mongo.update(Mongo.DBNAMES.accountCache, userId, data)
  } catch (e) {
    // console.log('setCache', e)
  }

  // 30min cache, unless otherwise updated
  accountCache[userId].set('expires', +new Date() + 30 * 60 * 1000)
  accountCache[userId].set(`${key}` || `${res._id}`, data)

  if (!skipUpdate) pubsub.publish(EVENTS.ACCOUNTS_UPDATED, { updateAccount: getFullCache(userId) })
}

// Get all users and trigger holdings calc
const loadCache = async (userId) => {
  const users = await getUsers()

  users.forEach(async user => {
    try {
      // Get previously stored cache, and load in memory
      const res = await Mongo.find(Mongo.DBNAMES.accountCache, user._id, {})
      if (res.length) res.forEach(r => setCacheItem(r.userId, `${r._id}`, r, true))
    } catch (e) {
      // no cache available
    }
  })

  console.log('✅ Account Cache Loaded')
}

module.exports = {
  loadCache,
  getFullCache,
  setCacheItem,
  getCacheItem,
}
