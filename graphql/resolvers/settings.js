const { pubsub, EVENTS } = require('../subscriptions')
const Mongo = require('../../modules/mongo')

const fillDefaults = data => {
  // Fill missing defaults
  if (typeof data.slackAlertsActive === 'undefined') data.slackAlertsActive = true
  if (typeof data.rocketchatAlertsActive === 'undefined') data.rocketchatAlertsActive = true
  if (typeof data.priceChangeRare === 'undefined') data.priceChangeRare = true
  if (typeof data.priceAthAtl === 'undefined') data.priceAthAtl = true
  if (typeof data.accountBalanceLow === 'undefined') data.accountBalanceLow = 100
  if (typeof data.accountBalanceLargeSum === 'undefined') data.accountBalanceLargeSum = true
  if (typeof data.accountRewardBalance === 'undefined') data.accountRewardBalance = 100

  if (typeof data.priceChangeThresholds === 'undefined' || data.priceChangeThresholds === 'true') data.priceChangeThresholds = JSON.stringify(['10%','25%'])
  else data.priceChangeThresholds = data.priceChangeThresholds.replace(/ /g, '')

  return data
}

module.exports = {
  Query: {
    // NOTE: to be supported: startAt, endAt
    async userSettings(root, args, context, info) {
      if (!args || !args.userId) throw 'Arguments missing!'
      let res

      try {
        res = await Mongo.get('user', args.userId, Mongo.ObjectId(args.userId))
      } catch (e) {
        //
      }

      return fillDefaults(res || {})
    },
  },

  Mutation: {
    updateUserSettings: async (root, data, context) => {
      if (!data || !data.userId) throw 'Arguments missing!'
      let item
      const settings = fillDefaults(data)

      try {
        item = await Mongo.update('user', data.userId, settings)
      } catch (e) {
        throw e
      }

      // Trigger all listeners
      pubsub.publish(EVENTS.USER_SETTINGS_UPDATED, { updateUserSettings: item })
      return item
    },
  },

  Subscription: {
    updateUserSettings: {
      subscribe: () => pubsub.asyncIterator(EVENTS.USER_SETTINGS_UPDATED),
    },
  },
}
