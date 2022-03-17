export default {
  initialized: false,
  authenticated: false,
  rememberlogin: null,
  token: null,
  username: null,
  user: {},
  adminId: null,

  // general
  dataPollingInterval: 5,
  alertCheckPriceInterval: 5,
  alertCheckAccountInterval: 60,

  // API s
  alphavantageId: null,
  amberdataId: null,
  blockchairId: null,
  infuraId: null,
  portisDappId: null,
  quandlId: null,

  // Notifications
  slackAlertsActive: false,
  slackHookId: null,
  slackChannelId: 'general',
  rocketchatAlertsActive: false,
  rocketchatHookId: null,
  rocketchatChannelId: 'general',

  // alert settings
  priceChangeThresholds: ['10%', '25%'],
  priceChangeRare: true,
  priceAthAtl: true,
  accountBalanceLow: 100,
  accountBalanceLargeSum: true,
  accountRewardBalance: 50,
}
