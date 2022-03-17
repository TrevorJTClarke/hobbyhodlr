const path = require('path')
require('dotenv').config({ path: path.join(process.cwd(), '/secrets/.env') })
const express = require('express')
, bodyParser = require('body-parser')
, { createServer } = require('http')
, { ApolloServer, gql } = require('apollo-server-express')
, { typeDefs } = require('./graphql/schema')
, { resolvers } = require('./graphql/resolvers')
, aggregator = require('./modules/cron/dataAggregator')
, accountCache = require('./modules/accounting/cache')
, helmet = require('helmet')
, cors = require('cors')
, { authContext, authentication, authInitialize, checkInitialize, wsAuthContext } = require('./modules/session')

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: authContext,
  subscriptions: {
    onConnect: wsAuthContext,
  },
  debug: true,
})
const app = express()
const PORT = process.env.PORT || 2000

server.applyMiddleware({ app })

app.use(helmet())
app.use(cors())
app.use(express.static('dist'))
app.use(express.static('static'))
app.use(bodyParser.json())

app.get('/health', (req, res) => {
  res.sendStatus(200)
})

// NOTE: Init Only used for first time setup!
app.get('/initialize', checkInitialize)
app.post('/initialize', authInitialize)
app.post('/login', authentication)

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

const httpServer = createServer(app)
server.installSubscriptionHandlers(httpServer)

httpServer.listen({ port: PORT }, async () => {
  console.log(`██╗  ██╗ ██████╗ ██████╗ ██████╗ ██╗   ██╗
██║  ██║██╔═══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝
███████║██║   ██║██████╔╝██████╔╝ ╚████╔╝
██╔══██║██║   ██║██╔══██╗██╔══██╗  ╚██╔╝
██║  ██║╚██████╔╝██████╔╝██████╔╝   ██║
╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚═════╝    ╚═╝

██╗  ██╗ ██████╗ ██████╗ ██╗     ██████╗
██║  ██║██╔═══██╗██╔══██╗██║     ██╔══██╗
███████║██║   ██║██║  ██║██║     ██████╔╝
██╔══██║██║   ██║██║  ██║██║     ██╔══██╗
██║  ██║╚██████╔╝██████╔╝███████╗██║  ██║
╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝
\n     Research. Obsido. Perseverate.\n-----------------------------------------\n\n`)

  console.log(`🤖 Server ready at http://localhost:${PORT}${server.graphqlPath}`)
  console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}${server.subscriptionsPath}`)

  // start local data aggregations & runtime services
  aggregator.start()
  accountCache.loadCache()
})
