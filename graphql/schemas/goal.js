module.exports = {
  Single: `
    type Goal {
      _id: String
      userId: String
      assetId: String
      totalUnits: String
      currencyAmount: String
      createdAt: String

      "signfies this is a goal"
      dataType: String

      asset: Asset
    }
  `,

  Query: `
    goals(userId: String): [Goal]
  `,

  Mutation: `
    updateGoal(
      _id: String
      userId: String
      assetId: String
      totalUnits: String
      currencyAmount: String
      createdAt: String
    ): Goal

    removeGoal(
      id: String!
    ): Goal
  `,

  Subscription: `
    updateGoal: [Goal]
  `
}
