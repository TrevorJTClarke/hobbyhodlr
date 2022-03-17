
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

// ;(async () => {
//   const res = await getAaveReserves()
//   console.log('res', res[0])
// })();
