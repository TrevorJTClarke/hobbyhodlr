const md5 = require('md5')

module.exports = asset => {
  const { name, symbol } = asset
  // needs something, even if data doesnt exist for part
  if (!name) return md5(`${name}_${symbol}`)
  const cleanName = name.replace(/ /g, '').replace(/\//g, '').toLowerCase()
  const cleanSymbol = symbol ? symbol.replace(/ /g, '').toLowerCase() : ''
  return md5(`${cleanName}_${cleanSymbol}`)
}
