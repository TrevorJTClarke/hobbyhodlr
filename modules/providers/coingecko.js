const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(process.cwd(), '/secrets/.env') })
const axios = require('axios')
const { DateTime } = require('luxon')
const Mongo = require('../mongo')
const Timeseries = require('../timeseries')
const { getTodayDateMillis, getAssetIdBySymbol, getImageFileType } = require('../utils')

const baseUrl = `https://api.coingecko.com/api/v3`

const formatAsset = async d => {
  const f = {}
  f.symbol = d.symbol.toLowerCase()
  f.assetId = d.assetId ? d.assetId : await getAssetIdBySymbol(d.symbol, '../static/assetsRawData')
  f.updatedAt = new Date()
  f.coingeckoId = d.id

  // price data updates
  if (d.price_change_percentage_24h) f.changeInPrice = `${d.price_change_percentage_24h}`
  if (d.current_price) f.currentPrice = `${d.current_price}`

  // meta
  if (d.address) f.address = d.address
  if (d.name) f.name = d.name
  if (d.ath) f.allTimeHigh = `${d.ath}`
  if (d.ath_date) f.allTimeHighDate = new Date(`${d.ath_date}`)
  if (d.atl) f.allTimeLow = `${d.atl}`
  if (d.atl_date) f.allTimeLowDate = new Date(`${d.atl_date}`)
  if (d.market_cap) f.marketCap = `${d.market_cap}`
  if (d.total_supply) f.totalSupply = `${d.total_supply}`
  if (d.circulating_supply) f.circulatingSupply = `${d.circulating_supply}`
  if (d.market_cap_rank) f.rank = `${d.market_cap_rank}`
  if (d.image) f.src = `${d.image}`
  if (f.src) f.fileType = getImageFileType(f.src)

  // Support single formatting
  if (d.market_data) {
    if (d.market_data.price_change_percentage_24h) f.changeInPrice = `${d.market_data.price_change_percentage_24h}`
    if (d.market_data.current_price.usd) f.currentPrice = `${d.market_data.current_price.usd}`

    // meta
    if (d.market_data.ath.usd) f.allTimeHigh = `${d.market_data.ath.usd}`
    if (d.market_data.ath_date.usd) f.allTimeHighDate = new Date(`${d.market_data.ath_date.usd}`)
    if (d.market_data.atl.usd) f.allTimeLow = `${d.market_data.atl.usd}`
    if (d.market_data.atl_date.usd) f.allTimeLowDate = new Date(`${d.market_data.atl_date.usd}`)
    if (d.market_data.market_cap.usd) f.marketCap = `${d.market_data.market_cap.usd}`
    if (d.market_data.total_supply) f.totalSupply = `${d.market_data.total_supply}`
    if (d.market_data.circulating_supply) f.circulatingSupply = `${d.market_data.circulating_supply}`
    if (d.market_data.market_cap_rank) f.rank = `${d.market_data.market_cap_rank}`
  }

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

async function getAssetsIdList() {
  const url = `/coins/list`
  let items

  try {
    const { data } = await axios.get(`${baseUrl}${url}`)
    items = data
  } catch (e) {
    console.warn('CG: Issue retrieving Asset IDs', e)
    return []
  }

  return items
}

// NOTE: 250 is page max
async function getAssetsRanking(total = 250, page = 1) {
  const url = `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${total}&page=${page}&sparkline=false`
  let items
  let finalItems = []

  try {
    const { data } = await axios.get(`${baseUrl}${url}`)
    items = data
  } catch (e) {
    console.warn('PRICEFEED: Issue retrieving Asset Rankings', e)
  }

  try {
    finalItems = await Promise.all(items.map(async i => {
      if (i.assetId) await updateAssetByAssetId(i)
      return await formatAsset(i)
    }))
  } catch (e) {
    console.warn('PRICEFEED: Issue Formatting Asset Item', e)
  }

  return finalItems
}

const getAssetPrice = async asset => {
  if (!asset || !asset.coingeckoId) return Promise.reject(`No coingecko ID for asset ${asset.symbol}!`)
  const url = `/coins/${asset.coingeckoId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
  let item

  try {
    const { data } = await axios.get(`${baseUrl}${url}`)
    item = data
  } catch (e) {
    console.warn(`PRICEFEED: Issue retrieving Asset ${asset.symbol}`, e)
  }

  const formattedAsset = await formatAsset({
    symbol: asset.symbol,
    assetId: asset.assetId,
    ...item,
  })

  if (formattedAsset.assetId) await updateAssetByAssetId(formattedAsset)
  return formattedAsset
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
  if (!asset || (!asset.coingeckoId && !asset.symbol)) return // Promise.reject(`No coingecko ID for asset ${asset.symbol}!`)
  const cgId = asset.coingeckoId || asset.symbol // in case we didnt aggregate yet, worth a try!
  const url = `/coins/${cgId}/market_chart?vs_currency=usd&days=60`
  let items

  try {
    const { data } = await axios.get(`${baseUrl}${url}`)
    items = data.prices
  } catch (e) {
    console.warn(`HISTORICAL PRICES: Issue retrieving Asset ${asset.symbol} ${asset.coingeckoId} ${asset.assetId}`)
  }

  // loop data.prices
  if (!items || items.length <= 0) return []
  try {
    await Promise.all(items.map(async item => {
      // update the asset historical price
      return await Timeseries.updateItem({
        assetId: asset.assetId,
        timestamp: DateTime.fromISO(DateTime.fromMillis(item[0]).toISODate()).toMillis(),
        data: {
          symbol: asset.symbol.toLowerCase(),
          price: `${item[1]}`,
        },
        type: 'assetSeries',
      })
    }))
  } catch (e) {
    console.log('TS ITEM e', cgId, items.length, asset.assetId, e)
  }

  return items
}

// ;(async () => {
//   // TESTING ONLY!
//   await getAssetPriceHistorical({ coingeckoId: 'bitcoin', symbol: 'btc', assetId: '408fa195a34b533de9ad9889f076045e' })
// })();

module.exports = {
  getAssetsIdList,
  getAssetsRanking,
  getAssetPrice,
  getAssetPriceHistorical,
}
