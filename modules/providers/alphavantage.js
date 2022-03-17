const path = require('path')
require('dotenv').config({ path: path.join(process.cwd(), '/secrets/.env') })
const Big = require('big.js')
const axios = require('axios')
const { DateTime } = require('luxon')
const Mongo = require('../mongo')
const { getJsonFile, getAssetIdBySymbol, isDateBetween, getTodayDateMillis } = require('../utils')
const Timeseries = require('../timeseries')

const baseUrl = `https://www.alphavantage.co/query`
// NOTE: This might need to be shifted to DB
const apiKey = process.env.ALPHAVANTAGE_API_KEY || ''

const formatAsset = async d => {
  const f = {}
  f.symbol = d.symbol.toLowerCase()
  f.assetId = d.assetId ? d.assetId : await getAssetIdBySymbol(d.symbol, '../static/stocksRawData')
  f.updatedAt = new Date()

  // price data updates
  if (d['Global Quote'] && d['Global Quote']['10. change percent']) f.changeInPrice = `${d['Global Quote']['10. change percent']}`.replace(/\%/g, '')
  if (d['Global Quote'] && d['Global Quote']['05. price']) f.currentPrice = `${d['Global Quote']['05. price']}`

  // // TODO: Update the daily/hourly aggregates
  // if (d.) f.priceHourly = `${d.}`
  // if (d.) f.priceDaily = `${d.}`

  return f
}

const updateAssetByAssetId = async item => {
  const _aId = item.assetId
  // Store in DB
  if (item.assetId) {
    try {
      const dbItem = await Mongo.get(Mongo.DBNAMES.asset, null, { assetId: _aId })
      if (dbItem) {
        item._id = dbItem._id
        delete item.assetId
        await Mongo.update(Mongo.DBNAMES.asset, null, item)

        // update the asset historical price
        await Timeseries.updateItem({
          assetId: _aId,
          timestamp: getTodayDateMillis(),
          data: {
            symbol: item.symbol,
            price: item.currentPrice,
          },
          type: 'assetSeries',
        })
      }
    } catch (e) {
      console.warn(`PRICEFEED: Issue updating Asset ${item.name} ${item.assetId}`, e)
    }
  }
}

const getAssetsRanking = async () => {
  let staticStocks = []
  let finalItems = []

  try {
    staticStocks = await getJsonFile('../static/stocksRawData')
  } catch (e) {
    console.warn('PRICEFEED: Issue retrieving Asset Rankings', e)
  }
  if (!staticStocks || staticStocks.length <= 0) return []

  // for now, just filtering to assets that contain icons, as they are popular
  // NOTE: Should I alpha sort? Should I remove top 100 restriction?
  const items = staticStocks.filter(s => (s.icon)).splice(0,100)

  try {
    // gets all latest prices and data for all popular assets
    finalItems = await Promise.all(items.map(getAssetPrice))
  } catch (e) {
    console.log('e', e)
  }

  return finalItems
}

const getAssetPrice = async asset => {
  const url = `?function=GLOBAL_QUOTE&symbol=${asset.symbol.toUpperCase()}&apikey=${apiKey}`
  let item

  try {
    const { data } = await axios.get(`${baseUrl}${url}`)
    item = { ...asset, ...data }
  } catch (e) {
    console.warn(`PRICEFEED: Issue retrieving Asset ${asset.symbol}`, e)
  }

  const finalItem = await formatAsset(item)

  await updateAssetByAssetId(finalItem)
  return finalItem
}

// Gets historical prices for an asset
//
// Example output to DB: assetSeries
// {
//   assetId: "fdsa42342fdfdsfsdfdsfsfds",
//   timestamp: "1597869000000",
//   // per day price
//   price: 1234.09,
//   // later
//   m: {
//     // per min price
//     "1597869036000": 1233.67,
//     "1597869035000": 1233.67,
//     "1597869034000": 1233.67,
//   }
// }
const getAssetPriceHistorical = async asset => {
  if (!asset || !asset.symbol) return Promise.reject(`No coingecko ID for asset ${asset.symbol}!`)
  let items = []
  try {
    // This is one of the most annoying APIs ive ever worked with :/
    const avFn = 'TIME_SERIES_DAILY_ADJUSTED' // could use 'VWAP' also
    const ticker = asset.symbol.toUpperCase()
    const url = `${baseUrl}?function=${avFn}&symbol=${ticker}&datatype=json&outputsize=compact&apikey=${apiKey}`
    const { data } = await axios.get(url)
    const series = data && data['Time Series (Daily)'] ? data['Time Series (Daily)'] : {}
    const now = DateTime.local()
    const endDate = now.toISODate()
    const startDate = now.minus({ days: 61 }).toISODate()

    // loop the objects and format to normal array
    Object.keys(series).forEach(s => {
      if (series[s]['4. close'] && isDateBetween({ startDate, endDate, date: s })) {
        items.push([s, series[s]['4. close']])
      }
    })
  } catch (e) {
    // console.log('getAssetPriceHistorical e', e)
  }

  // update DB
  if (!items || items.length <= 0) return []
  try {
    await Promise.all(items.map(async item => {
      // update the asset historical price
      await Timeseries.updateItem({
        assetId: asset.assetId,
        timestamp: DateTime.fromISO(item[0]).toMillis(),
        data: {
          symbol: asset.symbol.toLowerCase(),
          price: `${item[1]}`,
        },
        type: 'assetSeries',
      })
    }))
  } catch (e) {
    // console.log('TS ITEM e', e)
  }

  return items
}

// ;(async () => {
//   // TESTING ONLY!
//   // await getAssetPriceHistorical({ symbol: 'msft', assetId: 'b5df2677dd089c786970be0ad08dcd94' })
//   const ranks = await getAssetsRanking()
//   console.log('ranks', ranks[0])
//   process.exit(0)
// })();

module.exports = {
  getAssetsRanking,
  getAssetPrice,
  getAssetPriceHistorical,
}
