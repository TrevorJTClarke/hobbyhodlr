export const TimeSeriesItem = `{
    t
    y
  }`

export const CoreComparison = `{
    asset ${TimeSeriesItem}
    spy ${TimeSeriesItem}
    xau ${TimeSeriesItem}
  }`

export const Stake = `{
    name
    symbol
    reward
    spread
  }`

export const Reward = `{
    address
    name
    symbol
    logo
    decimals
    liquidity
    rate
    borrowV
    borrowS
  }`

export const Compound = `{
    finalAmount
    compoundAmount
    series ${TimeSeriesItem}
    seriesMin ${TimeSeriesItem}
    seriesMax ${TimeSeriesItem}
  }`

export const GetStakes = `query GetStakes {
  staking ${Stake}
}`

export const GetRewards = `query GetRewards {
  rewards ${Reward}
}`

export const GetCoreComparison = `query GetCoreComparison(
  $asset: String!
) {
  corecomparison(asset: $asset) ${CoreComparison}
}`

export const GetUnitArb = `query GetUnitArb(
  $assetA: String!
  $assetB: String!
) {
  unitarb(assetA: $assetA, assetB: $assetB) ${TimeSeriesItem}
}`

export const GetCompound = `query GetCompound(
  $initialAmount: String!,
  $annualRate: String!,
  $years: String!
  $spread: String
) {
  compound(
    initialAmount: $initialAmount,
    annualRate: $annualRate,
    years: $years,
    spread: $spread
  ) ${Compound}
}`
