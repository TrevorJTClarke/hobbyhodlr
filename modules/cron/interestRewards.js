const path = require('path')
require('dotenv').config({ path: path.join(process.cwd(), '/secrets/.env') })
const Big = require('big.js')
const axios = require('axios')
const { DateTime } = require('luxon')
const { pubsub, EVENTS } = require('../../graphql/subscriptions')
const stakingRewards = require('../../static/stakingRewards.json')

function bigDivision(num, divisor, digits = 2) {
  if (typeof num != 'string') return new Error('bigDivision can only handle strings')
  if (num === '0') return num
  const a = new Big(num)
  return a
    .div(divisor)
    .toFixed(digits)
    .toString(10)
}

const getStakingRewards = async () => {
  return stakingRewards
}

// returns only data within cache
// TODO: Get brand!
const getAaveReserves = async () => {
  const RAY = 1e25
  const url = `https://api.thegraph.com/subgraphs/name/aave/protocol-raw`
  const query = `{
    reserves(
      first: 100
    ) {
      id
      name
      symbol
      decimals
      isActive
      variableBorrowRate
      stableBorrowRate
      totalLiquidity
      liquidityRate
    }
  }`

  const { data } = await axios.post(url, { query, variables: null })
  if (!data || !data.data || !data.data.reserves) return []
  return data.data.reserves.map(r => {
    // convert to normal human readable rates, using RAY conversion, from AAVE definition
    r.address = r.id
    r.rate = bigDivision(r.liquidityRate, RAY)
    r.liquidity = bigDivision(r.totalLiquidity, `1e${r.decimals}`)
    r.borrowV = bigDivision(r.variableBorrowRate, RAY)
    r.borrowS = bigDivision(r.stableBorrowRate, RAY)
    r.logo = `${r.name.replace(/ /g, '_').toLowerCase()}_${r.symbol.toLowerCase()}.png`

    return r
  })
}

// // NOTE: Currently waiting on a real API key.
// const getStakingRewards = async () => {
//   const url = 'https://graphql.stakingrewards.com'
//   const options = { headers: { authorization: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGFpbXMiOiJmcm9udGVuZC1wYWdlIiwiaWF0IjoxNTY2MjU2MTAwfQ.x1rAQmvtKXRSn9rr3EPYv507qkhdOQm0npPGmmxP74c'}}
//   const query = `{
//     assets {
//       priceUsd
//       isActive
//       name
//       symbol
//       stakingTypes {
//         rewardValue
//         rewardFormula
//         providerFee
//       }
//     }
//   }`
//
//   const { data } = await axios.post(url, { query, variables: {} }, options)
//   if (data.errors) Promise.reject(data.errors[0])
//   console.log('data', data)
// }

// Get compound data based on rate. Returns both total value and stepped value in same response
// USE:
//  getCompoundValue({ initialAmount: 4267, annualRate: 9.4, years: 1 })
//  {
//    finalAmount: 4687.16,
//    compoundAmount: 420.16,
//    series: [{
//      t: '2020-05-20',
//      y: 4300.424833333333,
//    }]
//  }
const getCompoundAssetValue = ({ initialAmount, annualRate, years, spread }) => {
  const now = DateTime.local()
  const monthlyRate = annualRate / 12 / 100
  const months = years * 12
  const series = []
  const seriesMin = []
  const seriesMax = []
  let finalAmount = 0
  let stepAmount = parseFloat(initialAmount) || 0

  for (i = 0; i <= months; i++) {
    stepAmount = parseFloat(initialAmount) * (Math.pow(1 + monthlyRate, i) - 1)
    const tmpAmount = parseFloat(initialAmount) + stepAmount
    series.push({
      t: now.plus({ months: i }).toString(),
      y: tmpAmount,
    })

    if (spread) {
      seriesMin.push({
        t: now.plus({ months: i }).toString(),
        y: tmpAmount + (stepAmount * (parseFloat(spread) / 100 * -1)),
      })
      seriesMax.push({
        t: now.plus({ months: i }).toString(),
        y: tmpAmount + (stepAmount * (parseFloat(spread) / 100)),
      })
    }
  }

  compoundAmount = `${initialAmount * (Math.pow(1 + monthlyRate, months) - 1)}`
  finalAmount = `${parseFloat(initialAmount) + parseFloat(compoundAmount)}`

  return {
    finalAmount,
    compoundAmount,
    series,
    seriesMin,
    seriesMax,
  }
}


// ;(async () => {
//   const res = await getAaveReserves()
//   console.log('res', res[0])
//
//   const compound = getCompoundAssetValue({ initialAmount: 4267, annualRate: 9.4, years: 1 })
//   console.log('compound', compound)
// })();

module.exports = {
  getStakingRewards,
  getAaveReserves,
  getCompoundAssetValue,
}
