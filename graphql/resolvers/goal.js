const { pubsub, withFilter, EVENTS } = require('../subscriptions')
const Mongo = require('../../modules/mongo')

module.exports = {
  Query: {
    async goals(root, args, context, info) {
      if (!args || !args.userId) throw 'Arguments missing!'
      let res

      try {
        res = await Mongo.find('goal', args.userId, args)
      } catch (e) {
        return []
      }

      // Get the asset data!
      const finalItems = await Promise.all(res.map(async item => {
        if (item.assetId) {
          try {
            item.asset = await Mongo.get('asset', args.userId, { _id: item.assetId })
            item.currencyAmount = `${parseFloat(item.totalUnits) * parseFloat(item.asset.currentPrice)}`
            item.dataType = 'goal'
          } catch (e) {
            // empty array so user can start fresh!
            return []
          }
        }
        return item
      }))

      return finalItems || []
    },
  },

  Mutation: {
    updateGoal: async (root, data, context) => {
      if (!data || !Object.keys(data).length || !data.userId || !data.assetId || !data.totalUnits) throw 'Data missing!'
      let item

      try {
        item = await Mongo.update('goal', data.userId, data)
      } catch (e) {
        throw e
      }

      // Trigger all listeners
      pubsub.publish(EVENTS.GOALS_UPDATED, {
        updateGoal: [item],
      })

      return item
    },
    removeGoal: async (root, data, context) => {
      // TODO: Loop portfolios and remove goalIds!
      if (!data || !Object.keys(data).length || !data.id) throw 'Data missing!'
      let item

      try {
        res = await Mongo.delete('goal', data.id)
      } catch (e) {
        throw e
      }

      return data
    },
  },

  Subscription: {
    updateGoal: {
      subscribe: () => pubsub.asyncIterator(EVENTS.GOALS_UPDATED),
    },
  },
}
