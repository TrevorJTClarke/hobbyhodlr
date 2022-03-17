module.exports = {
  Single: `
    type UserTotals {
      updatedAt: String
      networth: String
      cash: String
      traditional: String
      crypto: String
      interest: String
      interestPending: String
      dividends: String
      lending: String
    }

    type User {
      _id: String
      username: String
      pincode: String
      passcode: String

      totals: UserTotals
    }
  `,

  Query: `
    user(id: String): User
  `,

  Mutation: `
    updateUser(
      _id: String
      username: String
      pincode: String
      passcode: String

      totals: String
    ): User
  `,

  Subscription: `
    updateUser: [User]
    updateUserTotals: UserTotals
  `
}
