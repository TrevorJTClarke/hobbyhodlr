import { displayAsCurrency, toDenom, toMonetary } from '../utils/filters.js'

const getColorFromRaw = colors => {
  const defaultColor = 'rgba(81, 213, 176, 0.7)'
  if (!colors) return defaultColor
  const color = Array.isArray(colors) ? colors[0] : colors
  const rgba = color.search(',') !== -1 ? `rgba(${color}, 0.7)`: null
  const hex = color.search('#') !== -1 ? color: null
  return `${rgba || hex || defaultColor}`
}

const currentPrice = val => {
  return displayAsCurrency(val)
}

const currentAmount = val => {
  return displayAsCurrency(val)
}

const standardPercentChange = val => {
  if (!val || val === '') return val
  return `${toDenom(val, 2).replace(/ /g, '')}%`
}

const changeInPrice = standardPercentChange

const marketCap = val => {
  return '$' + toMonetary(val)
}

const totalSupply = (val, item) => {
  return toMonetary(val)
}

const getPercentChange = (a, b) => {
  return ((a - b) / b) * 100
}

export default {
  getColorFromRaw,
  getPercentChange,
  changeInPrice,
  currentPrice,
  currentAmount,
  totalSupply,
}
