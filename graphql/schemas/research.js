module.exports = {
  Single: `
    type TimeSeriesItem {
      t: String!
      y: String
    }

    type CoreComparison {
      asset: [TimeSeriesItem]
      spy: [TimeSeriesItem]
      xau: [TimeSeriesItem]
    }

    type Stake {
      name: String!
      symbol: String!
      reward: String!
      spread: String
    }

    type Reward {
      address: String!
      name: String!
      symbol: String!
      logo: String
      decimals: Int
      liquidity: String
      rate: String
      borrowV: String
      borrowS: String
    }

    type Compound {
      finalAmount: String!
      compoundAmount: String!
      series: [TimeSeriesItem]
      seriesMin: [TimeSeriesItem]
      seriesMax: [TimeSeriesItem]
    }
  `,

  Query: `
    corecomparison(asset: String!): CoreComparison

    unitarb(assetA: String!, assetB: String!): [TimeSeriesItem]

    staking: [Stake]

    rewards: [Reward]

    compound(
      initialAmount: String!,
      annualRate: String!,
      years: String!,
      spread: String
    ): Compound
  `,

  Mutation: `
  `,

  Subscription: `
  `
}
