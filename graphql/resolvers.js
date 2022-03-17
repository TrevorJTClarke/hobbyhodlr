const account = require('./resolvers/account')
const admin = require('./resolvers/admin')
const alerts = require('./resolvers/alerts')
const asset = require('./resolvers/asset')
const goal = require('./resolvers/goal')
const portfolio = require('./resolvers/portfolio')
const research = require('./resolvers/research')
const settings = require('./resolvers/settings')
const user = require('./resolvers/user')

const resolvers = {
  Query: {
    ...(account.Query ? account.Query : null),
    ...(admin.Query ? admin.Query : null),
    ...(alerts.Query ? alerts.Query : null),
    ...(asset.Query ? asset.Query : null),
    ...(goal.Query ? goal.Query : null),
    ...(portfolio.Query ? portfolio.Query : null),
    ...(research.Query ? research.Query : null),
    ...(settings.Query ? settings.Query : null),
    ...(user.Query ? user.Query : null),
  },

  Mutation: {
    ...(account.Mutation ? account.Mutation : null),
    ...(admin.Mutation ? admin.Mutation : null),
    ...(alerts.Mutation ? alerts.Mutation : null),
    ...(asset.Mutation ? asset.Mutation : null),
    ...(goal.Mutation ? goal.Mutation : null),
    ...(portfolio.Mutation ? portfolio.Mutation : null),
    ...(research.Mutation ? research.Mutation : null),
    ...(settings.Mutation ? settings.Mutation : null),
    ...(user.Mutation ? user.Mutation : null),
  },

  Subscription: {
    ...(account.Subscription ? account.Subscription : null),
    ...(admin.Subscription ? admin.Subscription : null),
    ...(alerts.Subscription ? alerts.Subscription : null),
    ...(asset.Subscription ? asset.Subscription : null),
    ...(goal.Subscription ? goal.Subscription : null),
    ...(portfolio.Subscription ? portfolio.Subscription : null),
    ...(research.Subscription ? research.Subscription : null),
    ...(settings.Subscription ? settings.Subscription : null),
    ...(user.Subscription ? user.Subscription : null),
  },
}

module.exports = { resolvers }
