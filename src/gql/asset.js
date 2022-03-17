export const Asset = `{
    _id
    symbol
    name
    updatedAt
    type
    subtype
    networkId
    rank
    currentPrice
    changeInPrice
    allTimeHigh
    allTimeHighDate
    allTimeLow
    allTimeLowDate
    decimals
    marketCap
    totalSupply
    circulatingSupply
    maxSupply
    sector
    region
    timezone
    currency
    icon
    colors

    changelly {
      id
      exchange
      withdrawFee
      confirmations
      fixedTime
    }

    exodus {
      supported
    }

    coinbase {
      supported
    }

    priceHourly
    priceDaily
  }`

export const GetAssets = `query GetAssets(
  $filters: String
  $sort: Int
  $skip: Int
  $limit: Int
){
  assets(
    filters: $filters
    sort: $sort
    skip: $skip
    limit: $limit
  ) ${Asset}
}`

export const GetAsset = `query GetAsset(
  $id: String
  $symbol: String
){
  assets(
    id: $id
    symbol: $symbol
  ) ${Asset}
}`

export const GetSupportedSymbols = `query GetSupportedSymbols {
  supportedSymbols
}`

export const SearchAssets = `query SearchAssets(
  $search: String
  $filters: String
  $field: String
  $sort: Int
  $skip: Int
  $limit: Int
){
  assets(
    search: $search
    filters: $filters
    field: $field
    sort: $sort
    skip: $skip
    limit: $limit
  ) {
    _id
    symbol
    name
    type
    subtype
    networkId
    rank
    icon
    colors
    decimals
    currentPrice
    changeInPrice
  }
}`

export const AssetsUpdatedEvent = `subscription AssetsUpdated {
  updateAssets ${Asset}
}`
