import { Asset } from './asset'

export const Account = `{
    _id
    userId
    assetId
    type
    subtype
    address
    nickname
    createdAt
    dataType
    manualUnits
    totalUnits
    totalStakedUnits
    totalPendingRewards
    category
    operatorName
    operatorAddress

    asset ${Asset}
  }`

export const AccountSeriesItem = `{
    _id
    userId
    timestamp
    networth
    cash
    traditional
    transactions
    crypto
    interest
    interestPending
    dividends
    lending
  }`

export const AccountHolding = `{
    _id
    userId
    assetId
    type
    dataType
    manualUnits
    totalUnits
    totalUnitsUSD
    totalStakedUnits
    totalStakedUnitsUSD
    totalPendingRewards
    totalPendingRewardsUSD

    asset ${Asset}
  }`

export const GetAccounts = `query GetAccounts($userId: String){
  accounts(userId: $userId) ${Account}
}`

export const GetHoldings = `query GetHoldings($userId: String){
  holdings(userId: $userId) ${AccountHolding}
}`

export const GetHoldingSeries = `query GetHoldingSeries($userId: String){
  holdingsSeries(userId: $userId) ${AccountSeriesItem}
}`

export const UpdateAccount = `mutation UpdateAccount(
  $_id: String
  $userId: String
  $assetId: String
  $type: String
  $subtype: String
  $address: String
  $createdAt: String
  $manualUnits: String
  $nickname: String
  $category: String
  $operatorName: String
  $operatorAddress: String
) {
  updateAccount(
    _id: $_id
    userId: $userId
    assetId: $assetId
    type: $type
    subtype: $subtype
    address: $address
    createdAt: $createdAt
    manualUnits: $manualUnits
    nickname: $nickname
    category: $category
    operatorName: $operatorName
    operatorAddress: $operatorAddress
  ) ${Account}
}`

export const RemoveAccount = `mutation RemoveAccount(
  $id: String!
) {
  removeAccount(
    id: $id
  ) ${Account}
}`

export const AccountsUpdatedEvent = `subscription AccountsUpdated {
  updateAccount ${Account}
}`
