const { gql } = require('apollo-server-express')
const account = require('./schemas/account')
const admin = require('./schemas/admin')
const alerts = require('./schemas/alerts')
const asset = require('./schemas/asset')
const goal = require('./schemas/goal')
const portfolio = require('./schemas/portfolio')
const research = require('./schemas/research')
const settings = require('./schemas/settings')
const user = require('./schemas/user')

const typeDefs = gql`
  ${account.Single}
  ${admin.Single}
  ${alerts.Single}
  ${asset.Single}
  ${goal.Single}
  ${portfolio.Single}
  ${research.Single}
  ${settings.Single}
  ${user.Single}

  type Query {
    ${account.Query}
    ${admin.Query}
    ${alerts.Query}
    ${asset.Query}
    ${goal.Query}
    ${portfolio.Query}
    ${research.Query}
    ${settings.Query}
    ${user.Query}
  }

  type Mutation {
    ${account.Mutation}
    ${admin.Mutation}
    ${alerts.Mutation}
    ${asset.Mutation}
    ${goal.Mutation}
    ${portfolio.Mutation}
    ${research.Mutation}
    ${settings.Mutation}
    ${user.Mutation}
  }

  type Subscription {
    ${account.Subscription}
    ${admin.Subscription}
    ${alerts.Subscription}
    ${asset.Subscription}
    ${goal.Subscription}
    ${portfolio.Subscription}
    ${research.Subscription}
    ${settings.Subscription}
    ${user.Subscription}
  }
`

module.exports = { typeDefs }
