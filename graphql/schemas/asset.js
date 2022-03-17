module.exports = {
  Single: `
    type Asset {
      _id: String
      symbol: String
      name: String
      updatedAt: String

      "signfies this is an account"
      dataType: String

      "Options: cryptocurrency, security"
      type: String

      "Options: blockchain, token, etf"
      subtype: String

      "Used for associating constants in calculating"
      networkId: String

      "other helpful data"
      rank: Int
      currentPrice: String
      changeInPrice: String
      allTimeHigh: String
      allTimeHighDate: String
      allTimeLow: String
      allTimeLowDate: String
      decimals: String
      marketCap: String
      totalSupply: String
      circulatingSupply: String
      maxSupply: String

      "meta"
      sector: String
      region: String
      timezone: String
      currency: String

      "branding"
      icon: String
      colors: [String]

      "exchange/conversion data"
      changelly: Changelly
      exodus: Exodus
      coinbase: Coinbase

      "Price data for time series"
      priceHourly: String
      priceDaily: String
    }

    type Changelly {
      id: Int
      code: Int
      exchange: Boolean
      withdrawFee: String
      confirmations: Int
      fixedTime: Int
    }

    type Exodus {
      supported: Boolean
    }

    type Coinbase {
      supported: Boolean
    }
  `,

  Query: `
    "Get Assets"
    assets(
      filters: String,
      search: String,
      field: String,
      sort: Int,
      skip: Int,
      limit: Int,
    ): [Asset]

    "Get a single Asset"
    asset(
      id: String,
      symbol: String
    ): Asset

    "Get supported blockchain Asset symbols"
    supportedSymbols: [String]
  `,

  Mutation: '',
  // NOTE: This will be managed by a serverside script only
  // Mutation: `
  //   "Update the Asset"
  //   updateAsset(
  //     symbol: String!
  //     name: String
  //     currentPrice: String
  //     totalSupply: String
  //     circulatingSupply: String
  //     maxSupply: String
  //     icon: String
  //   ): Asset
  // `,

  Subscription: `
    updateAssets: [Asset]
  `
}
