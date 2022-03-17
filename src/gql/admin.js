export const Admin = `{
    _id
    alphavantageId
    amberdataId
    blockchairId
    infuraId
    portisDappId
    quandlId
    dataPollingInterval
    alertCheckPriceInterval
    alertCheckAccountInterval
    slackHookId
    slackChannelId
    rocketchatDomain
    rocketchatHookId
    rocketchatChannelId
  }`

export const GetAdmin = `query GetAdmin{
  admin ${Admin}
}`

export const UpdateAdmin = `mutation UpdateAdmin(
  $_id: String
  $alphavantageId: String
  $amberdataId: String
  $blockchairId: String
  $infuraId: String
  $portisDappId: String
  $quandlId: String
  $dataPollingInterval: Int
  $alertCheckPriceInterval: Int
  $alertCheckAccountInterval: Int
  $slackHookId: String
  $slackChannelId: String
  $rocketchatDomain: String
  $rocketchatHookId: String
  $rocketchatChannelId: String
) {
  updateAdmin(
    _id: $_id
    alphavantageId: $alphavantageId
    amberdataId: $amberdataId
    blockchairId: $blockchairId
    infuraId: $infuraId
    portisDappId: $portisDappId
    quandlId: $quandlId
    dataPollingInterval: $dataPollingInterval
    alertCheckPriceInterval: $alertCheckPriceInterval
    alertCheckAccountInterval: $alertCheckAccountInterval
    slackHookId: $slackHookId
    slackChannelId: $slackChannelId
    rocketchatDomain: $rocketchatDomain
    rocketchatHookId: $rocketchatHookId
    rocketchatChannelId: $rocketchatChannelId
  ) ${Admin}
}`

export const UpdateAdminEvent = `subscription UpdateAdmin {
  updateAdmin ${Admin}
}`
