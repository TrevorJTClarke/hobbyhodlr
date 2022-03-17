import { Account } from './account'
import { Goal } from './goal'

export const UserTotals = `{
    updatedAt
    networth
    cash
    traditional
    crypto
    interest
    interestPending
    dividends
    lending
  }`

export const User = `{
    _id
    username
    pincode
    passcode

    totals ${UserTotals}
  }`

export const GetUser = `query GetUser($id: String){
  user(id: $id) ${User}
}`

export const UpdateUser = `mutation UpdateUser(
  $_id: String
  $username: String
  $pincode: String
  $passcode: String
  $totals: String
) {
  updateUser(
    _id: $_id
    username: $username
    pincode: $pincode
    passcode: $passcode
    totals: $totals
  ) ${User}
}`

export const UpdateUserEvent = `subscription UpdateUser {
  updateUser ${User}
}`

export const UpdateUserTotals = `subscription UpdateUserTotals {
  updateUserTotals ${UserTotals}
}`
