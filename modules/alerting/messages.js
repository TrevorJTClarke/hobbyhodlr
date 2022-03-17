const utils = require('../utils')

// NOTE: Functions provide messages with dynamic payloads
// Possible additions to these alerts:
// * portfolio performance over: doubled, up 10%, traditional vs crypto
// * comparitive assets: conversion rate from ETH to BTC is at a recent low consider asset swap
// * unstaking balance is available (needs txns likely)
const templates = {
  priceChange: [
    `ASSET_NAME (ASSET_SYMBOL) is PRICE_DIRECTION PRICE_PERCENT to PRICE_VALUE in the past ALERT_WINDOW.`,
    `In the past ALERT_WINDOW, ASSET_NAME (ASSET_SYMBOL) is PRICE_DIRECTION PRICE_PERCENT to PRICE_VALUE.`,
    `ASSET_NAME (ASSET_SYMBOL) price jumped PRICE_DIRECTION PRICE_PREVIOUS_VALUE to PRICE_VALUE, PRICE_DIRECTION PRICE_PERCENT over the past ALERT_WINDOW!`,
    `ASSET_NAME (ASSET_SYMBOL) price moved PRICE_DIRECTION PRICE_PERCENT PRICE_PREVIOUS_VALUE to PRICE_VALUE!`,
    `Over the past ALERT_WINDOW, ASSET_NAME (ASSET_SYMBOL) price moved PRICE_DIRECTION PRICE_PREVIOUS_VALUE to PRICE_VALUE, PRICE_DIRECTION PRICE_PERCENT!`,
    `Over the past ALERT_WINDOW, ASSET_NAME (ASSET_SYMBOL) price jumped PRICE_DIRECTION PRICE_PERCENT PRICE_PREVIOUS_VALUE to PRICE_VALUE!`,
    `ASSET_NAME (ASSET_SYMBOL) price moved PRICE_DIRECTION PRICE_PERCENT to PRICE_VALUE!`,
    `ASSET_NAME (ASSET_SYMBOL) price jumped PRICE_PERCENT to PRICE_VALUE!`,
    `ASSET_NAME (ASSET_SYMBOL) price is now PRICE_VALUE, moving PRICE_PERCENT PRICE_DIRECTION!`,
    `ASSET_NAME (ASSET_SYMBOL) is trending PRICE_DIRECTION, moving PRICE_PERCENT to PRICE_VALUE!`,
  ],
  rewards: [
    `ASSET_NAME (ASSET_SYMBOL) reward balance is ACCOUNT_REWARD_UNIT (ACCOUNT_REWARD_USD) and ready to claim!LINK_URL`,
    `Hooray! You've earned ACCOUNT_REWARD_UNIT (ACCOUNT_REWARD_USD) ASSET_NAME (ASSET_SYMBOL) rewards!LINK_URL`,
    `Check out those sweet rewards! You've earned ACCOUNT_REWARD_UNIT (ACCOUNT_REWARD_USD) ASSET_NAME (ASSET_SYMBOL)!LINK_URL`,
    `Today is looking up, your ASSET_NAME (ASSET_SYMBOL) holdings earned ACCOUNT_REWARD_UNIT (ACCOUNT_REWARD_USD)!LINK_URL`,
  ],
  lowBalance: [
    `Low balance of ACCOUNT_TOTAL_USD (ACCOUNT_TOTAL_UNITS ASSET_SYMBOL) for ASSET_NAME account ACCOUNT_NAME (ACCOUNT_ADDRESS)! LINK_URL!`,
  ],
  largeBalanceMovement: [
    `Large amount of BALANCE_CHANGE_USD (BALANCE_PERCENT) moved BALANCE_DIRECTION account ACCOUNT_NAME (ACCOUNT_ADDRESS)!COMMENTLINK_URL`,
    `Large balance change detected in ACCOUNT_NAME (ACCOUNT_ADDRESS), BALANCE_CHANGE_USD (BALANCE_PERCENT) moved BALANCE_DIRECTION!LINK_URL`,
  ],
  priceAllTimeChange: [
    `ASSET_NAME (ASSET_SYMBOL) is PRICE_DIRECTION PRICE_PERCENT to PRICE_VALUE approaching all time PRICE_HIGH_LOW, good PRICE_BUY_SELL opportunity?`,
    `ASSET_NAME (ASSET_SYMBOL) is PRICE_DIRECTION PRICE_PERCENT to PRICE_VALUE approaching all time PRICE_HIGH_LOW`,
    `Approaching all time PRICE_HIGH_LOW, ASSET_NAME (ASSET_SYMBOL) is PRICE_DIRECTION PRICE_PERCENT at PRICE_VALUE`,
  ],
  tips: [
    // TODO: Change these to dynamic once needed -- for emails
    `BTC and ATOM are on 🔥 this morning`,
    `Bitcoin is trending up today`,
    `MSFT is down in morning trading`,
    `Ethereum is trending positive in midnight trading`,
    `ETC is trending 👎-3.77% today`,
    `KAVA is moving 👆🏻7.81%, kicking your account an extra $1,239! Consider staking, no not 🥩ing!`,
    `Five out of four people admit their portfolio diversity needs some work, let HobbyHodlr help with those fractions!`,
    `Weekly Portfolio returns are trending 👉, with LTC pulling the surprise gain!`,
    `Asset volatility getting you down? Try dollar cost averaging.`,
  ]
}

const getRandomTemplateByType = type => {
  const idx = templates[type].length > 1 ? utils.getRand(0, templates[type].length) : 0
  return templates[type][idx]
}

const getMessageFromTemplate = (fields, template) => {
  if (!Object.keys(fields).length || !template) return
  let str = template

  for (const k in fields) {
    const rgx = new RegExp(k, 'ig')
    if (fields[k]) str = `${str}`.replace(rgx, fields[k])
  }

  return `${str}`.replace(/  /g, ' ')
}

const priceChange = (data, settings) => {
  const tmpl = getRandomTemplateByType('priceChange')
  const changeAmt = parseFloat(data.asset.changeInPrice)
  const fields = {
    ALERT_WINDOW: settings.timeFrame || '',
    ASSET_NAME: data.asset.name || '',
    ASSET_SYMBOL: `${data.asset.symbol}`.toUpperCase() || '',
    PRICE_DIRECTION: changeAmt > 0 ? 'up' : 'down',
    PRICE_VALUE: utils.displayAsCurrency(data.asset.currentPrice) || '',
    PRICE_PERCENT: utils.formatPercent(data.asset.changeInPrice) || '',
    PRICE_PREVIOUS_VALUE: ' ',
  }

  if (data.asset.previousPrice) fields.PRICE_PREVIOUS_VALUE = `from ${utils.displayAsCurrency(data.asset.previousPrice)}`

  return getMessageFromTemplate(fields, tmpl)
}

const priceAllTimeChange = (data, settings) => {
  const tmpl = getRandomTemplateByType('priceAllTimeChange')
  const changeAmt = parseFloat(data.asset.changeInPrice)
  const price = parseFloat(data.asset.currentPrice)
  const priceMedian = (parseFloat(data.asset.allTimeHigh) + parseFloat(data.asset.allTimeLow)) / 2
  const fields = {
    ASSET_NAME: data.asset.name || '',
    ASSET_SYMBOL: `${data.asset.symbol}`.toUpperCase() || '',
    PRICE_DIRECTION: changeAmt > 0 ? 'up' : 'down',
    PRICE_VALUE: utils.displayAsCurrency(data.asset.currentPrice) || '',
    PRICE_PERCENT: utils.formatPercent(data.asset.changeInPrice) || '',
    PRICE_HIGH_LOW: price > priceMedian ? 'high' : 'low',
    PRICE_BUY_SELL: price > priceMedian ? 'sell' : 'buy',
  }

  return getMessageFromTemplate(fields, tmpl)
}

// TODO: Validate!!!
const rewards = (data, settings) => {
  const tmpl = getRandomTemplateByType('rewards')
  const units = parseFloat(data.account.totalPendingRewards)
  const price = parseFloat(data.asset.currentPrice)
  const fields = {
    ASSET_NAME: data.asset.name || '',
    ASSET_SYMBOL: `${data.asset.symbol}`.toUpperCase() || '',
    ACCOUNT_REWARD_UNIT: units || '',
    ACCOUNT_REWARD_USD: utils.displayAsCurrency(units * price) || '',
    LINK_URL: `<${utils.getServerUrl()}| See reward balance 👉>`,
  }

  return getMessageFromTemplate(fields, tmpl)
}

const lowBalance = data => {
  const tmpl = getRandomTemplateByType('lowBalance')
  const name = data.account.type === 'security' ? data.account.address : data.account.nickname
  const address = data.account.type === 'security' ? data.account.nickname : data.account.address
  const units = parseFloat(data.account.manualUnits || data.account.totalUnits)
  const price = parseFloat(data.asset.currentPrice)
  const fields = {
    ACCOUNT_TOTAL_UNITS: units || '',
    ACCOUNT_TOTAL_USD: utils.displayAsCurrency(units * price) || '',
    ACCOUNT_NAME: name || '',
    ACCOUNT_ADDRESS: address || '',
    ASSET_NAME: data.asset.name || '',
    ASSET_SYMBOL: `${data.asset.symbol}`.toUpperCase() || '',
    LINK_URL: `<${utils.getServerUrl()}|Please validate account balance 👉>`,
  }

  return getMessageFromTemplate(fields, tmpl)
}

// TODO: Validate!!!
const largeBalanceMovement = (data, settings) => {
  console.log('data.accountPrevious', data.accountPrevious)
  const tmpl = getRandomTemplateByType('largeBalanceMovement')
  const name = data.account.type === 'security' ? data.account.address : data.account.nickname
  const address = data.account.type === 'security' ? data.account.nickname : data.account.address
  const units = parseFloat(data.account.manualUnits || data.account.totalUnits)
  const unitsPrevious = data.accountPrevious ? parseFloat(data.accountPrevious.manualUnits || data.accountPrevious.totalUnits) : 0
  const price = parseFloat(data.asset.currentPrice)
  const change = units - unitsPrevious
  const changeUSD = parseFloat(change * price)
  const direction = changeUSD > 0 ? 'to' : 'from'
  const comment = changeUSD > 0 ? `Hopefully it's borrowed from a pessimist. They’ll never expect it back.` : ''
  const fields = {
    ACCOUNT_NAME: name || '',
    ACCOUNT_ADDRESS: address || '',
    BALANCE_CHANGE_USD: utils.displayAsCurrency(changeUSD) || '',
    BALANCE_PERCENT: utils.getFormattedPercentChange(parseFloat(units * price), parseFloat(unitsPrevious * price)),
    BALANCE_DIRECTION: direction,
    COMMENT: comment,
    LINK_URL: `<${utils.getServerUrl()}| See more 👉>`,
  }

  return getMessageFromTemplate(fields, tmpl)
}

module.exports = {
  priceChange,
  priceAllTimeChange,
  rewards,
  lowBalance,
  largeBalanceMovement,
}
