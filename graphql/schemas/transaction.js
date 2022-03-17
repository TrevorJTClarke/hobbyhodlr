module.exports = {
  Single: `
    type Transaction {
      _id: String
      assetId: String
      networkId: String
      userId: String
      timestamp: String
      amount: String
      type: String
    }
  `,

  Query: `
    transactions: Transaction
  `,

  Mutation: ``,

  Subscription: ``
}
