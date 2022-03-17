const path = require('path')
require('dotenv').config({ path: path.join(process.cwd(), '/secrets/.env') })
const axios = require('axios')
const { DateTime } = require('luxon')
// const Web3Data = require('web3data-js')
const interest = require('../../modules/cron/interestRewards.js')

// configure external providers:
// const w3d = new Web3Data(process.env.AMBERDATA_API_KEY)
const w3d = {}

const getPercentChange = (a, b) => {
  return ((a - b) / b) * 100
}

const isDateBetween = ({ startDate, endDate, date }) => {
  const s = DateTime.fromISO(startDate)
  const e = DateTime.fromISO(endDate)
  const d = DateTime.fromISO(date)
  return (s.startOf('day') < d.startOf('day')) && (e.startOf('day') > d.startOf('day'))
}

module.exports = {
  Query: {
    async corecomparison(p, params) {
      const pair = params.asset.toLowerCase() || 'btc'
      const now = DateTime.local()
      const endDate = now.toISODate()
      const startDate = now.minus({ days: 31 }).toISODate()
      const timeFormat = 'iso'
      const timeInterval = 'days'
      const prices = {
        asset: [],
        spy: [],
        xau: [],
      }

      // get digital asset prices, defaults to Bitcoin
      try {
        const assetRes = await w3d.market.getPrices(pair, { startDate, endDate, timeFormat, timeInterval })
        const assetSeries = assetRes[`${pair}_usd`].reverse()
        const firstAssetPrice = assetSeries[0] && assetSeries[0].price ? assetSeries[0].price : 0

        if (assetRes && assetRes[`${pair}_usd`]) {
          prices.asset = assetRes[`${pair}_usd`].map(p => ({ t: p.timestamp, y: getPercentChange(p.price, firstAssetPrice) }))
        }
      } catch (e) {
        console.log('assetRes e', e)
      }

      // get gold prices
      try {
        const gE = now.toFormat('yyyy-MM-dd')
        const gS = now.minus({ days: 31 }).toFormat('yyyy-MM-dd')
        const gldRes = await axios.get(`https://www.quandl.com/api/v3/datasets/LBMA/GOLD.json?start_date=${gS}&end_date=${gE}&api_key=${process.env.QUANDL_API_KEY}`)
        const dataSeries = gldRes.data.dataset.data
        const firstGldPrice = dataSeries[dataSeries.length - 1] && dataSeries[dataSeries.length - 1][2] ? dataSeries[dataSeries.length - 1][2] : 0

        if (dataSeries && dataSeries.length > 0) {
          prices.xau = dataSeries
            .filter(i => isDateBetween({ startDate, endDate, date: i[0] }))
            .map(d => ({ t: DateTime.fromISO(d[0]).toISODate(), y: getPercentChange(d[2], firstGldPrice) }))
        }
      } catch (e) {
        console.log('gldRes e', e)
      }

      // get S&P 500 ETF prices
      try {
        // This is one of the most annoying APIs ive ever worked with :/
        const { data } = await axios.get(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=SPY&datatype=json&apikey=${process.env.ALPHAVANTAGE_API_KEY}`)
        const series = data && data['Time Series (Daily)'] ? data['Time Series (Daily)'] : {}
        const rawSeries = []

        // loop the objects and format to normal array
        Object.keys(series).forEach(s => {
          if (series[s]['4. close'] && isDateBetween({ startDate, endDate, date: s })) {
            rawSeries.push({
              t: DateTime.fromISO(s).toISODate(),
              y: series[s]['4. close'],
            })
          }
        })

        const firstSpyPrice = rawSeries[rawSeries.length - 1].y
        prices.spy = rawSeries.map(r => ({
          t: r.t,
          y: getPercentChange(r.y, firstSpyPrice),
          price: r.y,
        }))
      } catch (e) {
        console.log('spyRes e', e)
      }

      return prices
    },
    async unitarb(p, params) {
      const pairA = params.assetA.toLowerCase() || 'btc'
      const pairB = params.assetB.toLowerCase() || 'eth'
      const now = DateTime.local()
      const endDate = now.toISODate()
      const startDate = now.minus({ days: 31 }).toISODate()
      const timeFormat = 'iso'
      const timeInterval = 'days'
      const options = { startDate, endDate, timeFormat, timeInterval }
      const arbArray = []
      let firstArray = []

      // get first item
      try {
        const assetARes = await w3d.market.getPrices(pairA, options)
        const assetAKey = Object.keys(assetARes)[0]
        const assetASeries = assetARes[assetAKey].reverse()

        if (assetASeries && assetASeries.length > 0) {
          firstArray = assetASeries.map(p => ({ t: p.timestamp, y: p.price }))
        }
      } catch (e) {
        console.log('assetARes e', e)
      }

      if (!firstArray || firstArray.length <= 0) return []

      // get second item
      try {
        const assetBRes = await w3d.market.getPrices(pairB, options)
        const assetBKey = Object.keys(assetBRes)[0]
        const assetBSeries = assetBRes[assetBKey].reverse()

        if (assetBSeries && assetBSeries.length > 0) {
          firstArray.forEach(f => {
            assetBSeries.forEach(b => {
              if (b.timestamp === f.t) {
                arbArray.push({
                  t: f.t,
                  y: parseFloat(f.y) / parseFloat(b.price)
                })
              }
            })
          })
          // loop and assign unit arb about, ratio is (A / B)
          firstArray = assetBSeries.map(p => ({ t: p.timestamp, y: p.price }))
        }
      } catch (e) {
        console.log('assetARes e', e)
      }

      return arbArray
    },

    async rewards(p, params) {
      return interest.getAaveReserves()
    },

    async staking(p, params) {
      return interest.getStakingRewards()
    },

    async compound(p, params) {
      return interest.getCompoundAssetValue(params)
    },
  },

  Mutation: {
  },

  Subscription: {
  },
}
