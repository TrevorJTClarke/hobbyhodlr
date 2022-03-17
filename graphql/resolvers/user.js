const bcrypt = require('bcrypt')
const { pubsub, withFilter, EVENTS } = require('../subscriptions')
const Mongo = require('../../modules/mongo')
const { storePassword } = require('../../modules/session')

module.exports = {
  Query: {
    async user(root, args, context, info) {
      if (!args || !args.id) return Promise.reject('Arguments missing!')
      let res

      try {
        res = await Mongo.get('user', args.id, Mongo.ObjectId(args.id))
      } catch (e) {
        return Promise.reject(e)
      }
      if (!res) Promise.resolve({})

      const safeItem = { ...res }
      delete safeItem.passcode

      return safeItem || {}
    },
  },

  Mutation: {
    updateUser: async (root, data, context) => {
      if (!data || !Object.keys(data).length) return Promise.reject('Data missing!')
      let item

      // if the passcode field is there, create a one way hash
      if (data.passcode) data.passcode = await bcrypt.hash(data.passcode, 10)

      try {
        item = await Mongo.update('user', data.id || data._id, data)
      } catch (e) {
        return Promise.reject(e)
      }

      const safeItem = { ...item }
      delete safeItem.passcode

      // Trigger all listeners
      pubsub.publish(EVENTS.USER_UPDATED, { updateUser: safeItem })
      return safeItem
    },
  },

  Subscription: {
    updateUser: {
      subscribe: () => pubsub.asyncIterator(EVENTS.USER_UPDATED),
    },
    updateUserTotals: {
      subscribe: () => pubsub.asyncIterator(EVENTS.USER_TOTALS_UPDATED),
    },
  },
}
