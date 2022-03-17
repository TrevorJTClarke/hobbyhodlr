const Big = require('big.js')

// Static map of number formats.
export const metric = [
  { value: 1, symbol: ' ' },
  { value: 1e3, symbol: 'k' },
  { value: 1e6, symbol: 'M' },
  { value: 1e9, symbol: 'G' },
  { value: 1e12, symbol: 'T' },
  { value: 1e15, symbol: 'P' },
  { value: 1E18, symbol: 'E' },
]

// Static map of number formats.
export const monetary = [
  { value: 1, symbol: ' ' },
  { value: 1e3, symbol: 'k' },
  { value: 1e6, symbol: 'MM' },
  { value: 1e9, symbol: 'B' },
  { value: 1e12, symbol: 'T' },
]

// Static map of number formats.
export const denominations = [
  { value: 1, symbol: ' ' },
  { value: 1e3, symbol: 'k' },
  { value: 1e6, symbol: 'M' },
  { value: 1e9, symbol: 'B' },
  { value: 1e12, symbol: 'T' },
  // { value: 1e15, symbol: 'P' },
  // { value: 1E18, symbol: 'E' },
]

export const wei = [
  { value: 1, symbol: 'Wei' },
  { value: 1e9, symbol: 'Gwei' },
  { value: 1e18, symbol: 'Ether' },
]

export const dynamicUnit = (unit, token) => {
  return [
    { value: 1, symbol: `${unit}` },
    { value: 1e18, symbol: `${token}` },
  ]
}

export const milliseconds = [
  // { value: 1, symbol: 'ms', div: 60 },
  { value: 1e3, symbol: 'sec', div: 60 },
  { value: 6e4, symbol: 'min', div: 60 },
  { value: 36e5, symbol: 'hr', div: 24 },
  { value: 864e5, symbol: 'dy', div: 7 },
  { value: 6048e5, symbol: 'wk', div: 4 },
  { value: 2592e6, symbol: 'mon', div: 12 },
  { value: 31104e6, symbol: 'yr', div: 1 },
]

export const units = {
  wei,
  metric,
  monetary,
  milliseconds,
}

export const addCommas = x => {
  if (!x) return 0
  const tmp = x.toString().split('.')
  tmp[0] = tmp[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return tmp.join('.')
}
export const addCommasIfValid = x => {
  if (x == null) return '-'
  return addCommas(x)
}

export const numFormatObj = function(keys, amount, digits = 2) {
  const reg = /\.0+$|(\.[0-9]*[1-9])0+$/
  let i
  const num =
    amount && typeof amount.value !== 'undefined'
      ? parseFloat(amount.value)
      : parseFloat(amount)
  // Milliseconds Extra Formatting
  if (keys[0].symbol === 'sec') {
    for (i = keys.length - 1; i > 0; i--) {
      if (num >= keys[i].value) break
    }

    const item = keys[i]
    const hasPrev = i > 0
    const prevItem = hasPrev ? keys[i - 1] : {}
    const remainder = hasPrev ? (num % item.value) / item.value : 0
    const vNum = num / item.value
    const val = hasPrev ? Math.round(vNum - remainder) : vNum.toFixed(digits)
    const extraVal = hasPrev
      ? ` ${Math.round((num % item.value) / prevItem.value)}`
      : ''
    const extraSym = hasPrev ? prevItem.symbol : ''
    const str = `${val}${item.symbol}${extraVal}${extraSym}`

    return {
      formatted: str,
      short: str,
      value: addCommas(
        (num / keys[i].value).toFixed(digits).replace(reg, '$1'),
      ),
      unit: item.symbol,
      symbol: item.symbol,
      raw: amount.value || amount,
    }
  }

  for (i = keys.length - 1; i > 0; i--) {
    if (num >= keys[i].value) break
  }

  const keyValue = parseFloat(keys[i].value)
  const keySym = keys[i].symbol || amount.unit
  //.replace(reg, '$1')
  const keyFormatted = addCommas(
    (num / keyValue).toFixed(digits),
  )

  return {
    formatted: `${keyFormatted} ${keySym}`,
    short: `${keyFormatted}${keySym}`,
    value: keyFormatted,
    unit: keySym,
    symbol: keySym,
    raw: amount.value || amount,
  }
}

export const toWei = (num, digits = 2) => {
  // if we have previous value, use predefined unit & value
  if (num && typeof num.value !== 'undefined') {
    const u = num.unit && num.unit !== 0 ? ` ${num.unit}` : ''
    const n =
      num.value !== 0 ? parseFloat(num.value).toFixed(digits) : num.value
    return `${addCommas(n)}${u}`
  }
  if (!num) return 0
  return numFormatObj(wei, num, digits).formatted
}

// dynamic version of toWei based on network unit
export const toRawUnit = (num, unit, token, digits = 2) => {
  if (!num) return 0
  return numFormatObj(dynamicUnit(unit, token), num, digits).formatted
}

export const toMetric = (num, digits) => {
  if (!num) return 0
  return numFormatObj(metric, num, digits).formatted
}

export const toMetricIfValid = (num, digits) => {
  if (num == null) return '-'
  return numFormatObj(metric, num, digits).formatted
}

export const toMonetary = (num, digits) => {
  if (!num) return digits ? parseFloat(num).toFixed(digits) : 0
  return numFormatObj(monetary, num, digits).short
}

export const toMonetaryIfValid = (num, digits) => {
  if (num == null) return '-'
  return numFormatObj(monetary, num, digits).short
}

export const toDenom = (num, digits) => {
  if (!num) return 0
  return numFormatObj(denominations, num, digits).short
}

export const toDenomIfValid = (num, digits) => {
  if (num == null) return '-'
  return numFormatObj(denominations, num, digits).formatted
}

export const toUnitObj = (unit, num, digits) => {
  if (!num) return 0
  if (!unit || !units[unit]) return num
  return numFormatObj(units[unit], num, digits)
}

export const toUnit = (unit, num, digits) => toUnitObj(unit, num, digits).formatted

export const parseUnitNum = (num, unit, digits) => {
  if (!num) return 0
  if (!unit || !units[unit]) return num
  return numFormatObj(units[unit], num, digits).value
}

export const parseUnitSym = (num, unit, digits) => {
  if (!num) return 0
  if (!unit || !units[unit]) return num
  return numFormatObj(units[unit], num, digits).symbol
}

export const displayUnitNum = data => {
  if (!data) return ''
  const v = data.value ? data.value : data
  return `${parseFloat(v).toFixed(6)} ${data.unit}`
}

export const convertNumToUnit = (num, unit, sym, digits) => {
  if (!num) return 0
  if (!sym || !unit || !units[unit]) return num
  let finNum = 0
  units[unit].forEach(u => {
    if (u.symbol === sym) finNum = parseFloat(num) * u.value
  })
  return digits ? finNum.toFixed(digits) : finNum
}

export const hashShorten = (str, len = 8) => {
  if (!str) return ''
  const half = Math.round(len / 2)
  return str && str.length > len
    ? `${str.substring(0, half)}…${str.slice(-half)}`
    : str
}

export const fromNow = ts => {
  if (process.server) return
  if (!ts) return window.moment().fromNow()
  return window.moment(ts).fromNow()
}

export const dateTime = ts => {
  if (!ts) return window.moment().format('M/DD/YY - h:mma')
  return window.moment(ts).format('M/DD/YY - h:mma')
}

export const removeSpecialChars = str => {
  if (!str) return str
  let q = str.replace(/[^\w\s]/gi, '').replace(/\\\.,'"/gi, '')
  if (typeof q !== 'number') q = q.toLowerCase()
  return q
}

export const convertToCurrencyNumber = (value, currency) => {
  if (!currency || !currency.price) return null
  if (!value) return null
  const amount = parseFloat(value)
  const rate = parseFloat(currency.price)
  const calc = (amount * rate).toFixed(2)
  return calc
}

export const convertToCurrency = (value, currency) => {
  return addCommas(convertToCurrencyNumber(value, currency))
}

export const displayAsCurrency = value => {
  if (!value || isNaN(value)) return '-'
  // https://stackoverflow.com/questions/23887400/how-to-get-first-2-non-zero-digits-after-decimal-in-javascript
  let decimals = 1 - Math.floor(Math.log(value) / Math.log(10))
  if (!decimals || decimals < 2) decimals = 2
  if (decimals > 8) decimals = 8
  let amt = parseFloat(value).toFixed(decimals)
  if (amt === '0.00000000') amt = '0.00'
  return `$${addCommas(amt)}`
}

// This requires data as an object with a value key
export const preciseDecimal = (data, digits = 8) => {
  const d = typeof digits === 'object' ? 8 : digits
  if (!data) return parseFloat(0).toFixed(d)
  const val = data && data.value ? data.value : data
  return `${addCommas(parseFloat(val).toFixed(d))}`
}

export const preciseDecimalNumber = (data, digits = 8) => {
  const d = typeof digits === 'object' ? 8 : digits
  if (!data) return parseFloat(0).toFixed(d)
  const val = data && data.value ? data.value : data
  return `${addCommas(Number(parseFloat(val).toFixed(d)))}`
}

export const preciseDecimalIfValid = (data, digits = 8) => {
  if (data == null) return '-'
  return preciseDecimalNumber(data, digits)
}

export const toRawFixedValue = (value, decimals = 12) => {
  return addCommas(parseFloat(value).toFixed(decimals))
}


export const multiplyStrings = function(n, m, digits = 0) {
  if (typeof n != 'string' || typeof m != 'string')
    return new Error('multiplyStrings can only handle strings')
  const a = new Big(n)
  const b = new Big(m)
  let res = a.times(b)
  res = res.toFixed(digits).toString(10)
  return res
}

export const divideStrings = function(n, m) {
  if (typeof n != 'string' || typeof m != 'string')
    return new Error('divideStrings can only handle strings')
  const a = new Big(n)
  const b = new Big(m)
  let res = a.div(b)
  res = res.toFixed(0).toString(10)
  return res
}

export const bigDivision = function(num, divisor, digits = 2) {
  if (typeof num != 'string')
    return new Error('bigDivision can only handle strings')
  if (num === '0') return num
  const a = new Big(num)
  return a
    .div(divisor)
    .toFixed(digits)
    .toString(10)
}

export const hexToRgb = hex => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : null
}

export const getRand = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const getPercent = (num, total) => {
  return Math.round((parseFloat(num) / total) * 100)
}

export default addCommas
