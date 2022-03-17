const path = require('path')
require('dotenv').config({ path: path.join(process.cwd(), '/secrets/.env') })
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const getColors = require('get-image-colors')
const Mongo = require('../mongo')
const assetId = require('../assetId')
const { getJsonFile, saveJsonFile, getLogoName } = require('../utils')
const { getAssetsRanking } = require('../providers/coingecko')

const newAssets = [] // raw list of all new assets
const loadedAssets = [] // helps when duplicates happen.
const fullPath = path.join(__dirname, '../../', 'static/logos')

const staticDataFiles = [
  '../static/assetsRawData',
  // 'static/stocksRawData',
]

const maxWhite = 215
const removeWhites = i => {
  let num = 0
  if (i.rgb()[0] > maxWhite) num += 1
  if (i.rgb()[1] > maxWhite) num += 1
  if (i.rgb()[2] > maxWhite) num += 1

  return num < 3
}

const saveUrlImage = async image => {
  let response

  try {
    response = await axios({ url: image.src, method: 'GET', responseType: 'stream' })
  } catch (e) {
    return Promise.reject(e)
  }

  if (
    !response.headers ||
    !response.headers['content-length'] ||
    response.headers['content-length'] === '0' ||
    parseInt(response.headers['content-length'], 10) <= 100
  ) {
    return Promise.resolve()
  }
  const file = fs.createWriteStream(path.join(fullPath, image.icon))

  try {
    response.data.pipe(file)
  } catch (e) {
    // console.log('file e', e)
  }

  return new Promise((resolve, reject) => {
    file.on('finish', resolve)
    file.on('error', resolve)
  })
}

const saveBrandFromImage = async image => {
  let brand = {}
  // get brand from local image
  try {
    // BTC [ '#f4941c', '#fcc078', '#fcac50', '#fccc96' ]
    const colors = await getColors(path.join(fullPath, image.icon))
    const hex = colors.filter(removeWhites).map(color => color.hex())
    brand.colors = hex
  } catch (e) {
    // console.log('e', e)
    return null
  }

  return brand
}

// Tasks:
// check for new assets
//  - coingecko
//  - token lists
//  - trustwallet images
// get all new assets images & branding
// IF (development) output to local json
// ELSE output to DB

const getNewAssetsData = async () => {
  // get coingecko assets
  // Loops top 10 pages of data (10 * 250 records)
  for (var i = 1; i < 3; i++) {
    const tmpList = await getAssetsRanking(250, i)

    // only add new assets for which we dont have symbol
    tmpList.forEach(item => {
      if (!loadedAssets.includes(item.symbol.toLowerCase())) {
        newAssets.push(item)
        loadedAssets.push(item.symbol.toLowerCase())
      }
    })
  }

  if (newAssets.length <= 0) return []
  console.log('New Assets Found:', newAssets.length)

  // Store in FS
  for (const n of newAssets) {
    try {
      if (n.src) {
        n.assetId = assetId(n)
        n.icon = getLogoName(n)
        n.type = 'cryptocurrency' // NOTE: Change this when getting more than just crypto!
        await saveUrlImage(n)

        // calculate branding from image
        const b = await saveBrandFromImage(n)
        if (b.colors) n.colors = b.colors
      }
    } catch (e) {
      console.log('e', e, n)
    }
  }

  // // NOTE: TESTING ONLY !!!
  // try {
  //   if (newAssets[0].src) {
  //     newAssets[0].assetId = assetId(newAssets[0])
  //     newAssets[0].icon = getLogoName(newAssets[0])
  //     newAssets[0].type = 'cryptocurrency' // NOTE: Change this when getting more than just crypto!
  //     await saveUrlImage(newAssets[0])
  //
  //     // calculate branding from image
  //     const b = await saveBrandFromImage(newAssets[0])
  //     if (b.colors) newAssets[0].colors = b.colors
  //   }
  // } catch (e) {
  //   // console.log('e', e)
  //   return Promise.reject(e)
  // }

  // return new assets found
  return newAssets
}

const loadAssetData = async file => {
  const res = await getJsonFile(file)
  if (!res) return

  // add uniques
  res.forEach(k => {
    if (k.symbol && !loadedAssets.includes(k.symbol)) {
      loadedAssets.push(k.symbol.toLowerCase())
    }
  })
}

const formatAndStoreAssetData = async file => {
  const res = await getJsonFile(file)
  if (!res) return

  // Store in DB
  for (const k of newAssets) {
    try {
      if (k.assetId) {
        if (k.allTimeHigh) k.allTimeHigh = `${k.allTimeHigh}`
        if (k.allTimeLow) k.allTimeLow = `${k.allTimeLow}`
        if (k.changeInPrice) k.changeInPrice = `${k.changeInPrice}`
        if (k.currentPrice) k.currentPrice = `${k.currentPrice}`
        if (!k.rank) k.rank = k.icon ? 9999 : 99999
        if (k.src) delete k.src
        await Mongo.update(Mongo.DBNAMES.asset, null, k)

        // Only add to the static files if its development env, to be committed
        if (process.env.NODE_ENV === 'development') res.push(k)
      }
    } catch (e) {
      // console.log('e', e)
      // return Promise.reject(e)
    }
  }

  if (process.env.NODE_ENV === 'development') {
    try {
      // Save static file for future updates
      const fsPath = path.join(__dirname, '../', `${file}.json`)
      await saveJsonFile(fsPath, res)
    } catch (e) {
      // console.log('e', e)
      // return Promise.reject(e)
    }
  }

  return newAssets
}

const processAllData = async () => {
  console.log('💸 Loading New Assets...')

  // loop all assets for local cache check
  try {
    await Promise.all(staticDataFiles.map(async file => {
      await loadAssetData(file)
    }))
  } catch (e) {
    console.log('ASSET LOAD ERROR:', e)
  }

  // loop all assets to format and get branding
  try {
    await getNewAssetsData()
  } catch (e) {
    console.log('ASSET RETRIEVE ERROR:', e)
  }

  // IF no assets, stop here
  if (!newAssets.length) {
    console.log('No New Assets')
    process.exit(0)
  }

  // loop all files store new assets in DB & possibly local static file
  try {
    await Promise.all(staticDataFiles.map(async file => {
      await formatAndStoreAssetData(file)
    }))
  } catch (e) {
    // console.log('ASSET STORAGE ERROR:', e)
  }

  // All done!
  console.log('🚀 Assets Update Complete!\n\n')
  process.exit(0)
}

processAllData()
