const bcrypt = require('bcrypt')
, crypto = require('crypto')
, jwt = require('jsonwebtoken')
, Mongo = require('./mongo')

const { privateKey, publicKey } = require('./keys')
const jwtConfig = { expiresIn: '7d', algorithm: 'RS256' }

const storePassword = async ({ userId, passcode }) => {
  const pass = await bcrypt.hash(passcode, 10)

  // Store result in mongo
  await Mongo.update(Mongo.DBNAMES.user, userId, { userId }, { passcode: pass })
}

const checkPassword = async (str, username) => {
  let user
  try {
    user = await Mongo.get(Mongo.DBNAMES.user, null, { username })
  } catch (e) {
    return e
  }
  if (!user) return

  const matches = bcrypt.compare(str, user.passcode)

  const safeItem = { ...user }
  delete safeItem.passcode

  return matches ? safeItem : null
}

const getUserByToken = token => {
  if (!token) throw new Error('Authentication required!')
  return new Promise((resolve, reject) => {
    jwt.verify(token, publicKey, jwtConfig, async (err, res) => {
      if (err) return resolve({ error: err })
      let user
      const userId = res.user && res.user._id ? res.user._id : null
      if (!userId) return resolve({ error: 'No user id from JWT!' })

      try {
        user = await Mongo.get(Mongo.DBNAMES.user, userId, { _id: Mongo.ObjectId(userId) })
      } catch (e) {
        reject(e)
      }
      if (!user) return resolve(user)

      delete user.passcode
      resolve(user)
    })
  })
}

const validateAndReturnUser = async token => {
  let data

  try {
    data = getUserByToken(token)
  } catch (e) {
    res.status(401).send('Invalid Credentials!')
    return
  }

  if (data.error) {
    res.status(401).send('Session expired, You must be re-login!')
    return
  }

  // add the user to the context
  return {
    user: data,
  }
}

const authContext = ({ req, res }) => {
  // No headers could mean websockets
  if (!req || !req.headers) return
  // get the user token from the headers
  const token = req.headers.authentication ? req.headers.authentication.replace('Bearer ', '') : ''
  return validateAndReturnUser(token)
}

const wsAuthContext = async (connectionParams, webSocket) => {
  if (connectionParams.authToken) return validateAndReturnUser(connectionParams.authToken)
  throw new Error('Missing auth token!')
}

const authentication = async (req, res, next) => {
  if (!req.body.passcode || !req.body.username) return new Error('Missing credentials!')
  let user
  try {
    user = await checkPassword(req.body.passcode, req.body.username)
  } catch (e) {
    //
  }
  if (!user) {
    res.status(401).send('Invalid Credentials!')
    return
  }
  let token

  try {
    const tokenPromise = new Promise((resolve, reject) => {
      jwt.sign({ user }, privateKey, jwtConfig, (err, tok) => {
        if (err) return reject(err)
        resolve(tok)
      })
    })
    token = await Promise.all([tokenPromise])
  } catch (e) {
    res.status(401).send('Error creating authenticated session!')
  }

  if (token.length > 0) res.json({ user, token: token[0] })
  else res.status(401).send('Error creating authenticated session!')
}

const authInitialize = async (req, res) => {
  if (!req.body.passcode || !req.body.username) return new Error('Missing credentials!')
  let users
  try {
    users = await Mongo.find(Mongo.DBNAMES.user, null, {})
  } catch (e) {
    //
  }
  if (users && users.length > 0) {
    res.status(401).send('User already exists! Please use authenticated updates!')
    return
  }
  let user, token

  // Store new user
  try {
    const passcode = await bcrypt.hash(req.body.passcode, 10)
    const salt = crypto.createHash('sha1').update(passcode).digest('hex')
    // without this ID, a lot of things break :/ This is why we must update the record with the DB generated ID for later use
    const newUser = await Mongo.update(Mongo.DBNAMES.user, null, { ...req.body, passcode, salt })
    user = await Mongo.update(Mongo.DBNAMES.user, newUser._id, { userId: `${newUser._id}`, ...newUser })
  } catch (e) {
    res.status(401).send('Error creating authenticated user!')
  }

  // // create default portfolio
  // try {
  //   await Mongo.update(Mongo.DBNAMES.portfolio, user._id, { userId: user._id, name: 'Default', color: '81,145,213' })
  // } catch (e) {
  //   console.log('default portfolio creation:', e)
  // }

  try {
    const tokenPromise = new Promise((resolve, reject) => {
      jwt.sign({ user }, privateKey, jwtConfig, (err, tok) => {
        if (err) return reject(err)
        resolve(tok)
      })
    })
    token = await Promise.all([tokenPromise])
  } catch (e) {
    res.status(401).send('Error creating authenticated session!')
  }

  if (token.length > 0) {
    res.json({
      user: {
        _id: user._id,
        userId: user.userId,
        username: user.username,
      },
      token: token[0],
    })
    return
  } else res.status(401).send('Error creating authenticated session!')
}

const checkInitialize = async (req, res) => {
  let users
  try {
    users = await Mongo.find(Mongo.DBNAMES.user, null, {})
  } catch (e) {
    //
  }

  res.json({ initialized: (users && users.length > 0) })
}

module.exports = {
  authContext,
  wsAuthContext,
  authentication,
  authInitialize,
  checkInitialize,
  storePassword,
  checkPassword,
}
