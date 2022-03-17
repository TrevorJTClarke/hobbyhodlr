const path = require('path')
require('dotenv').config({ path: path.join(process.cwd(), '/secrets/.env') })
const Mongo = require('../mongo')
const { getAssetIdBySymbol, getTodayDateMillis } = require('../utils')
const { getUsers } = require('../dataHelpers')
const coingecko = require('../providers/coingecko')
const alphavantage = require('../providers/alphavantage')

// returns lists of assets based on users prefs
const getAssetList = async userId => {
  const assetList = []
  let goals, accounts

  try {
    goals = await Mongo.find(Mongo.DBNAMES.goal, userId, {})
    if (goals && goals.length > 0) {
      goals.forEach(g => {
        if (!assetList.includes(g.assetId)) assetList.push(g.assetId)
      })
    }
  } catch (e) {
    console.log('no goals', e)
  }

  try {
    accounts = await Mongo.find(Mongo.DBNAMES.account, userId, {})
    if (accounts && accounts.length > 0) {
      accounts.forEach(a => {
        if (!assetList.includes(a.assetId)) assetList.push(a.assetId)
      })
    }
  } catch (e) {
    console.log('no accounts', e)
  }

  return assetList
}

const getAssetDataById = async id => {
  if (!id) return Promise.reject(`No assetId!`)
  let asset

  try {
    asset = await Mongo.get(Mongo.DBNAMES.asset, null, { _id: id })
    return asset
  } catch (e) {
    console.log('no asset', e)
    return e
  }
}

const getUsersAssetPrices = async (user) => {
  // NOTE: update items that are priority to users
  const list = []
  let users = []

  // formulate a full list of prices to update for all users
  if (!user) users = await getUsers()
  if (user && user._id) users.push(user)

  for (const u of users) {
    const tmpList = await getAssetList(`${u._id}`)
    tmpList.forEach(tl => {
      if (!list.includes(tl)) list.push(tl)
    })
  }

  for (const l of list) {
    const assetData = await getAssetDataById(l)
    if (assetData.type === 'cryptocurrency') await coingecko.getAssetPrice(assetData)
    if (assetData.type === 'security') await alphavantage.getAssetPrice(assetData)
  }
}

// TODO: finish!
const getAllAssetsRanking = async () => {
  await coingecko.getAssetsRanking()
  await alphavantage.getAssetsRanking()
  console.info(`📈 PRICEFEED UPDATE COMPLETE`)
}

// TODO: (Is this needed?)
// Obtains the last 30 days for all users preferred assets
// getUsersAssetPricesHistorical

// Obtains the last 30 days for all main assets
const getAssetPricesHistorical = async () => {
  // 1. get the top assets lists for crypto and traditional
  // 2. loop through and store historical prices for initialization
  try {
    const cryptoAssets = await coingecko.getAssetsRanking(100)
    for (const crypto of cryptoAssets) {
      if (crypto.assetId) await coingecko.getAssetPriceHistorical(crypto)
    }
  } catch (e) {
    // console.warn('Error loading crypto asset historical prices')
  }

  // TODO: Enable once tested & ready!
  // NOTE: Needs to get only assets with logos
  // try {
  //   const securityAssets = await alphavantage.getAssetsRanking()
  //   for (const security of securityAssets) {
  //     if (security.symbol && security.assetId) await alphavantage.getAssetPriceHistorical(security)
  //   }
  // } catch (e) {
  //   console.warn('Error loading security asset historical prices')
  // }
}


module.exports = {
  getAllAssetsRanking,
  getUsersAssetPrices,
  getAssetPricesHistorical,
  // getUsersAssetPricesHistorical,
}
