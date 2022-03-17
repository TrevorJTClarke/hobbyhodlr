const { pubsub, EVENTS } = require('../subscriptions')
const Mongo = require('../../modules/mongo')

module.exports = {
  Query: {
    async alerts(root, args, context, info) {
      if (!args || !args.userId) throw 'Arguments missing!'
      let res

      try {
        res = await Mongo.get('alerts', args.userId, Mongo.ObjectId(args.userId))
      } catch (e) {
        throw e
      }

      return res || {}
    },
  },

  Mutation: {},

  Subscription: {
    // pubsub.publish(EVENTS.ALERTS_UPDATE, { updateAlerts: item })
    updateAlerts: {
      subscribe: () => pubsub.asyncIterator(EVENTS.ALERTS_UPDATE),
    },
  },
}
