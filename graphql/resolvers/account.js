const { pubsub, withFilter, EVENTS } = require('../subscriptions')
const { DateTime } = require('luxon')
const Big = require('big.js')
const Mongo = require('../../modules/mongo')
const { getTypeSeries } = require('../../modules/timeseries')
const { BASE_TOTALS, uniqueTotals } = require('../../modules/accounting/helpers')
const { getUsersAssetPrices } = require('../../modules/cron/pricefeed')
const {
  getAccountHoldings,
  triggerCalcAccountHoldings,
  triggerAccountTotals,
  triggerAccountHistoricalTotals,
  getFormattedAccountData,
} = require('../../modules/accounting')

module.exports = {
  Query: {
    async accounts(root, args, context, info) {
      if (!args || !args.userId) throw 'Arguments missing!'
      let res

      try {
        res = await Mongo.find('account', args.userId, args)
      } catch (e) {
        //
      }
      if (!res || res.length <= 0) return []

      // Get the asset data!
      try {
        return Promise.all(res.map(getFormattedAccountData))
      } catch (e) {
        console.log('query accounts', e)
        return []
      }
    },
    async holdings(root, args, context, info) {
      if (!args || !args.userId) throw 'Arguments missing!'
      let res

      // Error handling here allows FE to find errors and show appropriate message
      try {
        res = await getAccountHoldings(args.userId)
      } catch (e) {
        // throw e
      }
      if (!res || res.length <= 0) return []

      // Get the asset data!
      try {
        const r = await Promise.all(res.map(getFormattedAccountData))
        return uniqueTotals(r)
      } catch (e) {
        console.log('query holdings', e)
        return res
      }
    },
    async holdingsSeries(root, args, context, info) {
      if (!args || !args.userId) throw 'Arguments missing!'
      let res
      const calcMap = new Map()

      // create blank timestamps data to be filled out IF data exists
      for (var i = 0; i < 32; i++) {
        const timestamp = DateTime.fromISO(DateTime.fromMillis(+new Date()).minus({ days: i }).toISODate()).toMillis()
        calcMap.set(`${timestamp}`, { ...BASE_TOTALS, timestamp })
      }

      try {
        const tmpRes = await getTypeSeries(args.userId, 'balanceSeries')
        res = tmpRes && tmpRes[0] && tmpRes[0].data ? tmpRes.map(d => ({ ...d, ...d.data })) : tmpRes
      } catch (e) {
        // no data, return defaults
      }

      // TODO: Change this methodology!!!
      // ---------------------------------
      // // If the series has less than 1 month, trigger recalculation, and return backfilled series
      // // Ideally this will only get triggered as necessary!
      // if (res.length < 31) {
      //   try {
      //     res = await triggerAccountHistoricalTotals(args.userId)
      //   } catch (e) {
      //     // return Promise.reject(e)
      //     return []
      //   }
      // }

      // override the default filler values with found DB values
      if (res && res.length) res.forEach(d => {
        const timestamp = DateTime.fromISO(DateTime.fromMillis(parseInt(d.timestamp)).toISODate()).toMillis()
        calcMap.set(`${timestamp}`, { ...d, timestamp })
      })

      return Array.from(calcMap.values())
        .map(i => { if (!i._id) i._id = `id${i.timestamp}`; return i })
        .sort((a, b) => (a.timestamp - b.timestamp))
    },
  },

  Mutation: {
    updateAccount: async (root, data, context) => {
      if (!data || !Object.keys(data).length || !data.userId || !data.assetId || !data.address) throw 'Data missing!'
      let items

      // minor data format cleanup
      if (data && data.meta) data.meta = JSON.parse(data.meta)

      // If i dont have the _id, simply add, otherwise Update
      const method = !data._id ? 'add' : 'update'
      try {
        items = await Mongo[method]('account', data.userId, data)
      } catch (e) {
        throw e
      }

      // Trigger all listeners
      pubsub.publish(EVENTS.ACCOUNTS_UPDATED, { updateAccount: items })

      // If "add" trigger price feed updates so new assets get included
      // 1. get new asset prices
      if (method === 'add') await getUsersAssetPrices({ _id: data.userId })

      // Always:
      // 2. get balance of new account(s)
      // 3. update totals for dashboards
      // --- These are triggers only ---
      triggerCalcAccountHoldings(data.userId)
      triggerAccountTotals(data.userId)

      return items
    },

    removeAccount: async (root, data, context) => {
      if (!data || !Object.keys(data).length || !data.id) throw 'Data missing!'
      let item

      try {
        item = await Mongo.delete('account', data.id)
      } catch (e) {
        throw e
      }

      // Immediately update totals, so today can reflect reality
      // TODO: Change to re-calculate all historical?
      triggerAccountTotals(data.userId)

      pubsub.publish(EVENTS.ACCOUNTS_REMOVED, { removeAccount: item })

      return data
    },
  },

  Subscription: {
    updateAccount: {
      subscribe: () => pubsub.asyncIterator(EVENTS.ACCOUNTS_UPDATED),
    },
    removeAccount: {
      subscribe: () => pubsub.asyncIterator(EVENTS.ACCOUNTS_REMOVED),
    },
  },
}
