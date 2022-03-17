// export const UserSettings = `{
//     userId
//     slackAlertsActive
//     rocketchatAlertsActive
//     priceChangeThresholds
//     priceChangeRare
//     priceAthAtl
//     accountBalanceLow
//     accountBalanceLargeSum
//     accountRewardBalance
//   }`

// export const GetUserSettings = `query GetUserSettings($userId: String){
//   userSettings(userId: $userId) ${UserSettings}
// }`

export const ClearCache = `mutation ClearCache() {
  clearCache() {
    status
  }
}`

// export const UpdateUserEvent = `subscription UpdateUserSettings {
//   updateUserSettings ${UserSettings}
// }`
