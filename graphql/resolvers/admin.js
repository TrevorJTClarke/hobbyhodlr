const { pubsub, withFilter, EVENTS } = require('../subscriptions')
const Mongo = require('../../modules/mongo')

const fillDefaults = data => {
  // Fill missing defaults
  if (typeof data.alertCheckPriceInterval === 'undefined') data.alertCheckPriceInterval = 5
  if (typeof data.alertCheckAccountInterval === 'undefined') data.alertCheckAccountInterval = 60

  return data
}

module.exports = {
  Query: {
    async admin(root, args, context, info) {
      let res

      try {
        res = await Mongo.find('admin', null, {})
      } catch (e) {
        return {}
      }

      return fillDefaults(res && res[0] ? res[0] : {})
    },
  },

  Mutation: {
    updateAdmin: async (root, data, context) => {
      if (!data || !Object.keys(data).length) throw 'Data missing!'
      let item
      const settings = fillDefaults(data)

      try {
        item = await Mongo.update('admin', null, settings)
      } catch (e) {
        throw e
      }

      // Trigger all listeners
      pubsub.publish(EVENTS.ADMIN_UPDATED, { updateAdmin: item, })
      return item
    },
  },

  Subscription: {
    updateAdmin: {
      subscribe: () => pubsub.asyncIterator(EVENTS.ADMIN_UPDATED),
    },
  },
}
