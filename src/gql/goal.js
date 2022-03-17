import { Asset } from './asset'

export const Goal = `{
    _id
    userId
    assetId
    totalUnits
    currencyAmount
    dataType
    createdAt

    asset ${Asset}
  }`

export const GetGoals = `query GetGoals($userId: String){
  goals(userId: $userId) ${Goal}
}`

export const UpdateGoal = `mutation UpdateGoal(
  $_id: String
  $userId: String
  $assetId: String
  $totalUnits: String
  $currencyAmount: String
  $createdAt: String
) {
  updateGoal(
    _id: $_id
    userId: $userId
    assetId: $assetId
    totalUnits: $totalUnits
    currencyAmount: $currencyAmount
    createdAt: $createdAt
  ) ${Goal}
}`

export const RemoveGoal = `mutation RemoveGoal(
  $id: String!
) {
  removeGoal(
    id: $id
  ) ${Goal}
}`

export const GoalsUpdatedEvent = `subscription GoalsUpdated {
  updateGoal ${Goal}
}`
