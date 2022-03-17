const fs = require('fs')
const path = require('path')
const { DateTime } = require('luxon')

const getServerIP = () => {
  const interfaces = require('os').networkInterfaces()
  for (const devName in interfaces) {
    const iface = interfaces[devName]

    for (var i = 0; i < iface.length; i++) {
      const alias = iface[i]
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) return alias.address
    }
  }

  return '0.0.0.0'
}

// TODO: Change to valid domain and configuration!
const getServerUrl = () => {
  const ip = getServerIP()
  const host = ip.search('192') !== -1 ? 'http' : 'https'
  const port = ip.search('192') !== -1 ? ':2000' : ''
  return `${host}://${ip}${port}`
}

const getJsonFile = async filePath => {
  const jsonPath = path.join(__dirname, `${filePath}.json`)

  try {
    const rawJson = await fs.readFileSync(jsonPath, 'utf-8')
    return JSON.parse(rawJson)
  } catch (e) {
    return { err: e }
  }
}

const saveJsonFile = async (filePath, data) => {
  try {
    // save data
    await fs.writeFileSync(filePath, JSON.stringify(data))
  } catch (e) {
    return Promise.reject(`Could not save ${filePath}`, e.message)
  }
  // console.log('Saved File:', filePath)
  return Promise.resolve(data)
}

const getTodayDateMillis = () => DateTime.fromISO(DateTime.local().toISODate()).toMillis()

const isDateBetween = ({ startDate, endDate, date }) => {
  const s = DateTime.fromISO(startDate)
  const e = DateTime.fromISO(endDate)
  const d = DateTime.fromISO(date)
  return (s.startOf('day') < d.startOf('day')) && (e.startOf('day') > d.startOf('day'))
}

const getAssetIdBySymbol = async (symbol, file) => {
  const all = await getJsonFile(file)
  let assetId

  all.forEach(a => {
    if (a.symbol && a.symbol.toLowerCase() === symbol.toLowerCase()) {
      assetId = a.assetId
    }
  })

  return assetId
}

const getImageFileType = src => {
  const ext = src ? src.split('.').pop() : null
  return ext ? ext.split('?')[0] : 'png'
}

const getLogoName = asset => {
  const type = asset.fileType || getImageFileType(asset.src)
  return `${asset.name.replace(/ /g, '_').replace(/\//g, '').toLowerCase()}_${asset.symbol.toLowerCase()}.${type}`
}

const getRand = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const addCommas = x => {
  if (!x) return 0
  const tmp = x.toString().split('.')
  tmp[0] = tmp[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return tmp.join('.')
}

const displayAsCurrency = value => {
  if (!value || isNaN(value)) return '-'
  let decimals = 1 - Math.floor(Math.log(value) / Math.log(10))
  if (!decimals || decimals < 2) decimals = 2
  if (decimals > 8) decimals = 8
  return `$${addCommas(parseFloat(value).toFixed(decimals))}`
}

const formatPercent = value => {
  const p = value.split('.')
  return `${p[0]}.${p[1].substring(0, 2)}%`
}

const getPercentChange = (a, b) => {
  return ((a - b) / b) * 100
}

const getFormattedPercentChange = (a, b) => {
  return formatPercent(((a - b) / b) * 100)
}

const getSafePollingInt = num => {
  const MAX = 24 * 60 * 60 * 1000
  const n = parseInt(num, 10)
  return n > MAX ? MAX : n
}

module.exports = {
  getServerUrl,
  getJsonFile,
  saveJsonFile,
  getAssetIdBySymbol,
  getLogoName,
  getImageFileType,
  getTodayDateMillis,
  isDateBetween,
  getRand,
  addCommas,
  displayAsCurrency,
  formatPercent,
  getPercentChange,
  getFormattedPercentChange,
  getSafePollingInt,
}
