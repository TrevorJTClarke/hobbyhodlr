const { pubsub, withFilter, EVENTS } = require('../subscriptions')
const Mongo = require('../../modules/mongo')

module.exports = {
  Query: {
    async portfolios(root, args, context, info) {
      if (!args || !args.userId) return Promise.reject('Arguments missing!')
      let res

      try {
        res = await Mongo.find('portfolio', args.userId, args)
      } catch (e) {
        return Promise.reject(e)
      }

      return res || []
    },
    async portfolio(root, args, context, info) {
      if (!args || !args.id) return Promise.reject('Arguments missing!')
      let res

      try {
        res = await Mongo.get('portfolio', args.userId, Mongo.ObjectId(args.id))
      } catch (e) {
        return Promise.reject(e)
      }

      return res || {}
    },
  },

  Mutation: {
    updatePortfolio: async (root, data, context) => {
      if (!data || !Object.keys(data).length || !data.userId) return Promise.reject('Data missing!')
      let item

      try {
        item = await Mongo.update('portfolio', data.userId, data)
      } catch (e) {
        return Promise.reject(e)
      }

      // Trigger all listeners
      pubsub.publish(EVENTS.PORTFOLIO_UPDATED, {
        updateUser: item,
      })
      return item
    },
  },

  Subscription: {
    updatePortfolio: {
      subscribe: () => pubsub.asyncIterator(EVENTS.PORTFOLIO_UPDATED),
    },
  },
}
