const fs = require('fs')
const path = require('path')
const Mongo = require('./mongo')
const assetId = require('./assetId')
const { getAssetPricesHistorical } = require('./cron/pricefeed')

const staticDataFiles = [
  'static/assetsRawData',
  'static/stocksRawData',
]

const getJsonFile = async filePath => {
  const jsonPath = path.join(__dirname, '../', `${filePath}.json`)

  try {
    const rawJson = await fs.readFileSync(jsonPath, 'utf-8')
    return { data: JSON.parse(rawJson) }
  } catch (e) {
    return { err: e }
  }
}

const loadedAssets = [] // helps when duplicates happen.
const formatAndStoreAssetData = async file => {
  const { err, data } = await getJsonFile(file)
  if (err) return err

  const finalItems = data.map(d => {
    const f = { ...d }
    f.assetId = assetId(f)
    if (f.allTimeHigh) f.allTimeHigh = `${d.allTimeHigh}`
    if (f.allTimeLow) f.allTimeLow = `${d.allTimeLow}`
    if (f.changeInPrice) f.changeInPrice = `${d.changeInPrice}`
    if (f.currentPrice) f.currentPrice = `${d.currentPrice}`
    if (!f.rank) f.rank = f.icon ? 9999 : 99999

    return f
  })

  // Store in DB
  for (const k of finalItems) {
    try {
      if (k.assetId && !loadedAssets.includes(k.symbol)) {
        await Mongo.update(Mongo.DBNAMES.asset, null, k)
        loadedAssets.push(k.symbol)
      }
    } catch (e) {
      // console.log('e', e)
    }
  }
  console.log(`✅ Import ${file} Complete!`)
}

const processAllData = async () => {
  console.log('--------------------------------\nLoading Hobby Hodlr Database\n--------------------------------\n\n')
  console.log('📥 Data Import Starting...')
  console.log('🗃 Creating Indexes...')
  // Setup table indexes
  await Mongo.index(Mongo.DBNAMES.alert, { timestamp: 1 }, { unique: true })
  await Mongo.index(Mongo.DBNAMES.asset, { assetId: 1 }, { unique: true })
  await Mongo.index(Mongo.DBNAMES.asset, { name: "text" }) // NOTE: test assigning to logo - since it would search name + symbol
  await Mongo.index(Mongo.DBNAMES.assetSeries, { timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 }) // NOTE: only holds price data for a year, so the DB doesn't bloat like crazy
  await Mongo.index(Mongo.DBNAMES.balanceSeries, { timestamp: 1 }, { unique: true })
  await Mongo.index(Mongo.DBNAMES.holdingSeries, { timestamp: 1 }, { unique: true })

  console.log('✅ Indexing Complete')
  console.log('💸 Loading Assets...')

  // loop all assets to format and store in DB
  try {
    await Promise.all(staticDataFiles.map(async file => {
      await formatAndStoreAssetData(file)
    }))
  } catch (e) {
    console.log('ASSET LOAD ERROR:', e)
  }

  console.log('✅ All Assets Loaded')
  console.log('💸 Loading Historical Prices...')

  // // Add historical prices to DB
  // await getAssetPricesHistorical()
  // console.log('✅ Historical Prices Import Complete!')

  // All done!
  console.log('🚀 Data Import Complete!\n\n\n\n')
  process.exit(0)
}

processAllData()
