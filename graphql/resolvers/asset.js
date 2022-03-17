const { pubsub, withFilter, EVENTS } = require('../subscriptions')
const Mongo = require('../../modules/mongo')
const { supportedChainSymbols, blockchainProviders } = require('../../modules/blockchains/providerBridge')

module.exports = {
  Query: {
    // Endpoint for querying raw assets with pagination
    async assets(root, args, context, info) {
      const filters = args && args.filters ? JSON.parse(args.filters) : {}
      const sort = args.sort || null
      const skip = args.skip || 0
      const limit = args.limit || 100
      const field = args.field || 'name'
      let arrItems = []

      if (args.search) {
        try {
          arrItems = await Mongo.search('asset', field, args.search, { rank: 1, ...filters })
        } catch (e) {
          //
        }
      } else {
        try {
          arrItems = await Mongo.find('asset', filters, { sort, skip, limit })
        } catch (e) {
          //
        }
      }

      return arrItems
    },

    // Supports multiple access styles:
    // Params: _id, symbol, search
    async asset(root, args, context, info) {
      if (!args) throw 'Arguments missing!'
      let res
      let asset = {}

      if (args.id) asset = Mongo.ObjectId(args.id)
      if (args.symbol) asset.symbol = args.symbol
      if (!Object.keys(asset).length) return Promise.reject('Arguments missing!')

      try {
        res = await Mongo.get('asset', asset)
      } catch (e) {
        // 
      }

      return res ? res : {}
    },

    // Lets the FE know which assets are fully supported and dont need Manual Units
    async supportedSymbols() {
      // Needed to compute supported
      await blockchainProviders()
      return supportedChainSymbols
    },
  },

  Mutation: {
  },

  Subscription: {
    updateAssets: {
      subscribe: () => pubsub.asyncIterator(EVENTS.ASSETS_UPDATED),
    },
  },
}
