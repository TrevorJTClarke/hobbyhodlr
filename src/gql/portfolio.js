import { Account } from './account'
import { Goal } from './goal'

export const Portfolio = `{
    _id
    userId
    name
    color
    createdAt

    goals ${Goal}
    accounts ${Account}
  }`

export const GetPortfolios = `query GetPortfolios($userId: String){
  portfolios(userId: $userId): ${Portfolio}
}`

export const GetPortfolio = `query GetPortfolio($id: String){
  portfolio(id: $id): ${Portfolio}
}`

export const UpdatePortfolio = `mutation UpdatePortfolio(
  $_id: String
  $userId: String
  $name: String
  $color: String
  $goalIds: String
  $accountIds: String
  $createdAt: String
) {
  updatePortfolio(
    _id: $_id
    userId: $userId
    name: $name
    color: $color
    goalIds: $goalIds
    accountIds: $accountIds
    createdAt: $createdAt
  ) ${Portfolio}
}`

export const UpdatePortfolioEvent = `subscription UpdatePortfolio {
  updatePortfolio ${Portfolio}
}`
