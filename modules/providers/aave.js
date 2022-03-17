
// returns only data within cache
// // TODO: Get brand!
// const getAaveReserves = async () => {
//   const RAY = 1e25
//   const url = `https://api.thegraph.com/subgraphs/name/aave/protocol-raw`
//   const query = `{
//     reserves(
//       first: 100
//     ) {
//       id
//       name
//       symbol
//       decimals
//       isActive
//       variableBorrowRate
//       stableBorrowRate
//       totalLiquidity
//       liquidityRate
//     }
//   }`
//
//   const { data } = await axios.post(url, { query, variables: null })
//   if (!data || !data.data || !data.data.reserves) return []
//   return data.data.reserves.map(r => {
//     // convert to normal human readable rates, using RAY conversion, from AAVE definition
//     r.address = r.id
//     r.rate = bigDivision(r.liquidityRate, RAY)
//     r.liquidity = bigDivision(r.totalLiquidity, `1e${r.decimals}`)
//     r.borrowV = bigDivision(r.variableBorrowRate, RAY)
//     r.borrowS = bigDivision(r.stableBorrowRate, RAY)
//     r.logo = `${r.name.replace(/ /g, '_').toLowerCase()}_${r.symbol.toLowerCase()}.png`
//
//     return r
//   })
// }
