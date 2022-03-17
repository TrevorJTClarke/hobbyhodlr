module.exports = {
  Single: `
    type UserSettings {
      userId: String
      slackAlertsActive: Boolean
      rocketchatAlertsActive: Boolean
      priceChangeThresholds: String
      priceChangeRare: Boolean
      priceAthAtl: Boolean
      accountBalanceLow: Int
      accountBalanceLargeSum: Boolean
      accountRewardBalance: Int
    }
  `,

  Query: `
    userSettings(userId: String): UserSettings
  `,

  Mutation: `
    updateUserSettings(
      userId: String
      slackAlertsActive: Boolean
      rocketchatAlertsActive: Boolean
      priceChangeThresholds: String
      priceChangeRare: Boolean
      priceAthAtl: Boolean
      accountBalanceLow: Int
      accountBalanceLargeSum: Boolean
      accountRewardBalance: Int
    ): UserSettings
  `,

  Subscription: `
    updateUserSettings: [UserSettings]
  `
}
