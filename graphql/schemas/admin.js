module.exports = {
  Single: `
    type Admin {
      _id: String
      alphavantageId: String
      amberdataId: String
      blockchairId: String
      infuraId: String
      portisDappId: String
      quandlId: String
      dataPollingInterval: Int
      alertCheckPriceInterval: Int
      alertCheckAccountInterval: Int

      slackHookId: String
      slackChannelId: String
      rocketchatDomain: String
      rocketchatHookId: String
      rocketchatChannelId: String
    }
  `,

  Query: `
    admin: Admin
  `,

  Mutation: `
    updateAdmin(
      _id: String
      alphavantageId: String
      amberdataId: String
      blockchairId: String
      infuraId: String
      portisDappId: String
      quandlId: String
      dataPollingInterval: Int
      alertCheckPriceInterval: Int
      alertCheckAccountInterval: Int

      slackHookId: String
      slackChannelId: String
      rocketchatDomain: String
      rocketchatHookId: String
      rocketchatChannelId: String
    ): Admin
  `,

  Subscription: `
    updateAdmin: Admin
  `
}
