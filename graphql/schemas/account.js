module.exports = {
  Single: `
    type Account {
      _id: String
      userId: String
      assetId: String
      address: String
      createdAt: String
      nickname: String

      "Options: cryptocurrency, security"
      type: String

      "Options: blockchain, token, etf, common, stablecoin, ...etc"
      subtype: String

      "Options: wallet, exchange, etc"
      category: String

      "signifies this is an account"
      dataType: String

      "total amount specified by user"
      manualUnits: String

      "total amount held"
      totalUnits: String
      totalUnitsUSD: String

      "total amount delegated to validation"
      totalStakedUnits: String
      totalStakedUnitsUSD: String

      "total amount yet to claim, claimed becomes part of totalUnits"
      totalPendingRewards: String
      totalPendingRewardsUSD: String

      "validator node address, optional"
      operatorName: String
      operatorAddress: String

      asset: Asset
    }

    type AccountSeriesItem {
      _id: String
      timestamp: String
      userId: String
      networth: String
      cash: String
      traditional: String
      transactions: String
      crypto: String
      interest: String
      interestPending: String
      dividends: String
      lending: String
    }
  `,

  Query: `
    accounts(userId: String): [Account]
    holdings(userId: String): [Account]
    holdingsSeries(userId: String): [AccountSeriesItem]
  `,

  Mutation: `
    updateAccount(
      _id: String
      userId: String
      assetId: String
      type: String
      subtype: String
      address: String
      manualUnits: String
      nickname: String
      createdAt: String
      category: String
      operatorName: String
      operatorAddress: String
    ): Account

    removeAccount(
      id: String
    ): Account
  `,

  Subscription: `
    updateAccount: [Account]
    removeAccount: Account
    updateHoldingSeries: Account
  `
}
