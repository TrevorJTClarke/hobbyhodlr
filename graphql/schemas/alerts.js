module.exports = {
  Single: `
    type Alert {
      userId: String

      "Alert triggered AT timestamp"
      timestamp: String

      "Simple alert string"
      title: String

      "Complex alert string, can be html or multi-line text"
      message: String

      "Asset data at time of trigger, for better comparison context"
      asset: String
    }
  `,

  Query: `
    alerts(
      userId: String
      startAt: String
      endAt: String
    ): [Alert]
  `,

  // No acknowledge system, no mutations needed yet
  Mutation: ``,

  Subscription: `
    updateAlerts: [Alert]
  `
}
