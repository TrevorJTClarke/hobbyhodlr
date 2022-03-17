const Big = require('big.js')
const axios = require('axios')
const { DateTime } = require('luxon')
const Mongo = require('./mongo')

const updateItem = async ({ assetId, userId, timestamp, data, type = 'balanceSeries' }) => {
  const item = { assetId, userId, timestamp, data }

  // store item in DB
  try {
    await Mongo.update(Mongo.DBNAMES[type], userId, item)
  } catch (e) {
    console.log('couldnt update Item', e)
  }

  return item
}

const upsertItem = async ({ userId, timestamp, data, type = 'balanceSeries' }) => {
  let seriesItem

  try {
    // get the item if it exits
    seriesItem = await Mongo.get(Mongo.DBNAMES[type], userId, { timestamp, userId: `${userId}` })
  } catch (e) {
    // error means no item found, still move forward
    // console.log('no seriesItem', e)
  }

  if (!seriesItem || !seriesItem.timestamp) seriesItem = { userId, timestamp }
  if (!seriesItem.data) seriesItem.data = {}

  // loop data fields and update
  if (data && Object.keys(data).length > 0) {
    Object.keys(data).forEach(k => {
      seriesItem.data[k] = data[k]
    })
  }

  // store item back in DB
  try {
    // get the item if it exits
    await Mongo.update(Mongo.DBNAMES[type], userId, seriesItem)
  } catch (e) {
    console.log('couldnt set seriesItem', e)
  }

  return seriesItem
}

// TODO: add params!
// return paginatable list of timeseries items
const getItems = async (userId, id, type = 'balanceSeries') => {
  let ts

  try {
    ts = await Mongo.find(Mongo.DBNAMES[type], userId, id ? { _id: id } : {})
    return ts
  } catch (e) {
    console.log('no items', e)
    return e
  }
}

const getTypeSeries = async (userId, type = 'balanceSeries', assetId) => {
  let res
  const now = DateTime.local()
  const endDate = now.toMillis()
  const startDate = now.minus({ days: 31 }).toMillis()

  try {
    // TODO: date range params!
    res = await Mongo.find(Mongo.DBNAMES[type], userId, { assetId, timestamp: { $lt: endDate, $gte: startDate }})
  } catch (e) {
    return []
  }

  // Format to chartable data set
  // Gets last bucketted data point, based on highest index
  return res.map(r => {
    // const lastPointIdx = Object.keys(r.data).map(d => (parseInt(d, 10))).sort((a, b) => (b - a))[0]
    // console.log('lastPointIdx', lastPointIdx)
    // const lastPoint = r.data[`${lastPointIdx}`]
    // console.log('lastPoint', lastPoint)
    // return {
    //   ...r,
    //   timestamp: DateTime.fromMillis(r.timestamp).toISO(),
    //   ...lastPoint,
    // }
    return r
  })
}

module.exports = {
  updateItem,
  upsertItem,
  getItems,
  getTypeSeries,
}
