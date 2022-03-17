module.exports = {
  Single: `
    type Portfolio {
      _id: String
      userId: String
      name: String
      color: String
      createdAt: String

      goals: [Goal]
      accounts: [Account]
    }
  `,

  Query: `
    portfolios(userId: String): [Portfolio]
    portfolio(id: String): Portfolio
  `,

  Mutation: `
    updatePortfolio(
      _id: String
      userId: String
      name: String
      color: String
      createdAt: String
      goalIds: String
      accountIds: String
    ): Portfolio
  `,

  Subscription: `
    updatePortfolio: [Portfolio]
  `
}
