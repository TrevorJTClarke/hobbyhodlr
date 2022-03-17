export default {
  initialized: state => state.initialized,
  authenticated: state => state.authenticated,
  rememberlogin: state => state.rememberlogin,
  token: state => state.token,
  username: state => state.username,
  user: state => state.user,
  adminId: state => state.adminId,

  // general
  dataPollingInterval: state => state.dataPollingInterval,
  alertCheckPriceInterval: state => state.alertCheckPriceInterval,
  alertCheckAccountInterval: state => state.alertCheckAccountInterval,

  // API s
  alphavantageId: state => state.alphavantageId,
  amberdataId: state => state.amberdataId,
  blockchairId: state => state.blockchairId,
  infuraId: state => state.infuraId,
  portisDappId: state => state.portisDappId,
  quandlId: state => state.quandlId,

  // Notifications
  slackAlertsActive: state => state.slackAlertsActive,
  slackHookId: state => state.slackHookId,
  slackChannelId: state => state.slackChannelId,
  rocketchatAlertsActive: state => state.rocketchatAlertsActive,
  rocketchatHookId: state => state.rocketchatHookId,
  rocketchatChannelId: state => state.rocketchatChannelId,

  // alert settings
  priceChangeThresholds: state => state.priceChangeThresholds,
  priceChangeRare: state => state.priceChangeRare,
  priceAthAtl: state => state.priceAthAtl,
  accountBalanceLow: state => state.accountBalanceLow,
  accountBalanceLargeSum: state => state.accountBalanceLargeSum,
  accountRewardBalance: state => state.accountRewardBalance,
}
