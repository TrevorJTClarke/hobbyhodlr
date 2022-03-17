export const UserSettings = `{
    userId
    slackAlertsActive
    rocketchatAlertsActive
    priceChangeThresholds
    priceChangeRare
    priceAthAtl
    accountBalanceLow
    accountBalanceLargeSum
    accountRewardBalance
  }`

export const GetUserSettings = `query GetUserSettings($userId: String){
  userSettings(userId: $userId) ${UserSettings}
}`

export const UpdateUserSettings = `mutation UpdateUserSettings(
  $userId: String
  $slackAlertsActive: Boolean
  $rocketchatAlertsActive: Boolean
  $priceChangeThresholds: String
  $priceChangeRare: Boolean
  $priceAthAtl: Boolean
  $accountBalanceLow: Int
  $accountBalanceLargeSum: Boolean
  $accountRewardBalance: Int
) {
  updateUserSettings(
    userId: $userId
    slackAlertsActive: $slackAlertsActive
    rocketchatAlertsActive: $rocketchatAlertsActive
    priceChangeThresholds: $priceChangeThresholds
    priceChangeRare: $priceChangeRare
    priceAthAtl: $priceAthAtl
    accountBalanceLow: $accountBalanceLow
    accountBalanceLargeSum: $accountBalanceLargeSum
    accountRewardBalance: $accountRewardBalance
  ) ${UserSettings}
}`

export const UpdateUserEvent = `subscription UpdateUserSettings {
  updateUserSettings ${UserSettings}
}`
