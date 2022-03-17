const path = require('path')
require('dotenv').config({ path: path.join(process.cwd(), '/secrets/.env') })
const crypto = require('crypto')
const { MongoClient, ObjectId, Timestamp } = require('mongodb')
const algorithm = 'aes-256-cbc'
const keySize = 32
const rounds = 8698

const DBNAMES = {
  account: 'account',
  accountCache: 'accountCache',
  admin: 'admin',
  alert: 'alert',
  asset: 'asset',
  assetSeries: 'assetSeries',
  balanceSeries: 'balanceSeries',
  goal: 'goal',
  holdingSeries: 'holdingSeries',
  portfolio: 'portfolio',
  user: 'user',
}

const nonEncryptedCollections = ['asset', 'assetSeries', 'alert', 'admin', 'assetTEST'] //, 'balanceSeries'
const nonEncryptedIndexes = ['_id', 'assetId', 'userId', 'hash', 'username', 'salt', 'passcode', 'timestamp']
const noEncrypt = collectionName => nonEncryptedCollections.includes(collectionName)

const getMongoUri = () => {
  if (!process.env.MONGO_USERNAME) throw new Error('No Mongo USERNAME found! Please specify in .env file!')
  if (!process.env.MONGO_PASSWORD) throw new Error('No Mongo PASSWORD found! Please specify in .env file!')

  const baseDb = process.env.MONGO_DATABASE ? process.env.MONGO_DATABASE : 'hobbyhodlr'
  const hostName = process.env.MONGO_HOSTNAME ? process.env.MONGO_HOSTNAME : '127.0.0.1'
  const authDb = process.env.MONGO_AUTH_TABLE ? `&authMechanism=DEFAULT&authSource=${process.env.MONGO_AUTH_TABLE}` : ''
  const userName = process.env.MONGO_USERNAME
  const password = process.env.MONGO_PASSWORD
  if (!userName || !password) return

  return `mongodb://${userName}:${password}@${hostName}/${baseDb}?retryWrites=true&w=majority${authDb}`
}

const getDbName = () => {
  return process.env.MONGO_DATABASE ? process.env.MONGO_DATABASE : 'hobbyhodlr'
}

const getEncryptionSecret = key => {
  // if specified all mongo data for user becomes encrypted irreversibly
  const envEncKey = process.env.MONGO_ENCRYPTION_KEY
  if (key) return key
  if (envEncKey) return envEncKey
  return null
}

const encryptData = (secret, salt, data) => {
  if (!secret || !data) return null
  const iv = crypto.randomBytes(16)
  const encryptionKey = getEncryptionSecret(secret)
  const key = crypto.pbkdf2Sync(encryptionKey, salt, rounds, keySize, 'sha512')
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv)
  const encryptedData = Buffer.concat([cipher.update(JSON.stringify(data)), cipher.final()])
  return `${iv.toString('hex')}g${encryptedData.toString('hex')}`
}

const decryptData = (secret, salt, encryptedData) => {
  if (!secret || !encryptedData) return null
  const textParts = encryptedData.split('g')
  const iv = Buffer.from(textParts.shift(), 'hex')
  const data = Buffer.from(textParts.join('g'), 'hex')
  const encryptionKey = getEncryptionSecret(secret)
  const key = crypto.pbkdf2Sync(secret, salt, rounds, keySize, 'sha512')
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv)
  let decryptedData = decipher.update(data)
  decryptedData = Buffer.concat([decryptedData, decipher.final()])
  return JSON.parse(decryptedData.toString())
}

class MongoProvider {
  constructor() {
    this.uri = getMongoUri()
    this.client = null
    this.ObjectId = ObjectId
    this.Timestamp = Timestamp
    this.DBNAMES = DBNAMES
    this.dbName = getDbName()

    return this
  }

  async connect() {
    if (!this.uri) throw 'No mongo connection uri, missing credentials!'
    let client = this.client
    const p = new Promise((resolve, reject) => {
      if (client) {
        resolve(client)
        return
      }

      const cl = new MongoClient(this.uri, { useNewUrlParser: true, useUnifiedTopology: true })

      cl.connect(err => {
        if (err) {
          reject('No mongo client established! Check your connection config!')
          return
        }

        resolve(cl)
      })
    })

    const c = await Promise.all([p])
    this.client = c[0]

    return this
  }


  async getEncryptedPayload(collectionName, userId, data) {
    const skipEncrypt = noEncrypt(collectionName)
    let encryptKeys = {}

    if (!skipEncrypt) {
      try {
        if (data.passcode && data.salt) encryptKeys = { key: data.passcode, salt: data.salt }
        else if (userId) encryptKeys = await this.getUserEncryptionKey(userId)
      } catch (e) {
        //
      }
      if (!encryptKeys.key || !encryptKeys.salt) return data
    }

    const encrypted = skipEncrypt ? data : encryptData(encryptKeys.key, encryptKeys.salt, data)
    const payload = skipEncrypt ? { ...data } : { encrypted }

    // supplement data thats needed for indexing
    nonEncryptedIndexes.forEach(ne => {
      if (data[ne]) payload[ne] = data[ne]
    })

    return payload
  }

  async getDecryptedPayload(collectionName, userId, data) {
    if ((data && !data.encrypted) || !data) return data
    let encryptKeys

    try {
      if (data.passcode && data.salt) encryptKeys = { key: data.passcode, salt: data.salt }
      else if (userId) encryptKeys = await this.getUserEncryptionKey(userId)
    } catch (e) {
      //
    }
    if (!encryptKeys.key || !encryptKeys.salt) return data

    const payload = { ...data }
    const decrypted = decryptData(encryptKeys.key, encryptKeys.salt, data.encrypted)
    delete payload.encrypted
    return { ...payload, ...decrypted }
  }

  async getUserEncryptionKey(userId, collectionName) {
    if (!userId) throw 'Missing userId!'
    if (!this.client) await this.connect()
    const Collection = this.client.db(getDbName()).collection(collectionName || DBNAMES.user)
    let res

    try {
      const _id = { _id: ObjectId(`${userId}`) }
      res = await Collection.findOne(_id)
    } catch (e) {
      throw e
    }

    if (!res) return res
    if (res && !res._id) throw res
    return { key: res.passcode || res.key, salt: res.salt }
  }

  // Add one or multiple items inserted into collection
  // mongo.add('user', '58f9ds89fg9fe89f8ds98f9fj', { username: 'tc' })
  async add(collectionName, userId, item, options) {
    const needsEncrypt = !nonEncryptedCollections.includes(collectionName)
    if (!collectionName || !item) throw 'Missing data for Add method!'
    if (needsEncrypt && !userId) throw 'Missing userId!'
    if (!this.client) await this.connect()
    const Collection = this.client.db(getDbName()).collection(collectionName)
    let res, data, encryptKey

    try {
      data = needsEncrypt ? await this.getEncryptedPayload(collectionName, userId, item) : item
      res = await Collection.insertOne(data, options)
    } catch (e) {
      throw e
    }

    if (res && res.result && res.result.ok !== 1) throw res
    return res.ops.map(r => ({ ...item, _id: r._id }))
  }

  // Get a single item by ID from a collection
  // mongo.get('user', '58f9ds89fg9fe89f8ds98f9fj', { _id: '58f9ds89fg9fe89f8ds98f9fj' })
  async get(collectionName, userId, filters) {
    const needsEncrypt = !nonEncryptedCollections.includes(collectionName)
    if (!collectionName || !filters || !Object.keys(filters).length) throw 'Missing data for Get method!'
    if (needsEncrypt && !userId && collectionName !== 'user') throw 'Missing userId!'
    if (!this.client) await this.connect()
    const Collection = this.client.db(getDbName()).collection(collectionName)
    let res, data, encryptKey

    try {
      res = filters._id ? await Collection.findOne(ObjectId(filters._id)) : await Collection.findOne(filters)
    } catch (e) {
      throw e
    }

    if (!res) return res
    if (res && !res._id) throw res

    const _uuid = collectionName === DBNAMES.user ? res._id : userId
    return needsEncrypt ? await this.getDecryptedPayload(collectionName, _uuid, res) : res
  }

  // Update an item from a collection
  // mongo.update('user', '58f9ds89fg9fe89f8ds98f9fj', { _id: '58f9ds89fg9fe89f8ds98f9fj', username: 'rc' })
  async update(collectionName, userId, item) {
    const needsEncrypt = !nonEncryptedCollections.includes(collectionName)
    if (!collectionName || !item) throw 'Missing data for Update method!'
    // if (needsEncrypt && !userId) return Promise.reject('Missing userId!')
    if (!this.client) await this.connect()
    const Collection = this.client.db(getDbName()).collection(collectionName)
    const _id = item._id ? ObjectId(item._id) : ObjectId()
    let res, data = {}, encryptKey

    // For things that need encryption, we must do a couple extra steps to ensure items are encrypted properly
    if (item._id) {
      // Get the exact item to be updated, so we can parse the encrypted fields to update/override
      try {
        res = await Collection.findOne({ _id: ObjectId(item._id) })
      } catch (e) {
        //
      }
    }

    if (needsEncrypt && userId) {
      // decrypt fields to override/update
      const decryptedData = await this.getDecryptedPayload(collectionName, userId, res)

      // override new fields:
      if (decryptedData) {
        Object.keys(decryptedData).forEach(i => {
          if (!nonEncryptedIndexes.includes(i) && decryptedData[i]) data[i] = decryptedData[i]
        })
      }
    } else if (!data) data = item
    if (item) {
      Object.keys(item).forEach(m => {
        if (item[m]) data[m] = item[m]
      })
    }

    // Finally, go straight to the updating
    try {
      let updateFilters = item._id ? { _id } : { userId, assetId: item.assetId }
      if (item && item.timestamp) updateFilters = { timestamp: item.timestamp }
      if (item && item.timestamp && item.assetId) updateFilters = { timestamp: item.timestamp, assetId: item.assetId }
      const finalItem = needsEncrypt ? await this.getEncryptedPayload(collectionName, userId, data) : { ...data }
      if (finalItem._id) delete finalItem._id
      if (finalItem.timestamp) delete finalItem.timestamp

      res = await Collection.updateOne(updateFilters, { $set: finalItem }, { upsert: true })
    } catch (e) {
      throw e
    }

    if (res && res.result && res.result.ok !== 1) throw res
    let finalItem
    if (res.result && res.result.upserted && res.result.upserted[0]) finalItem = { ...res.result.upserted[0], ...item }
    else finalItem = item
    delete finalItem.encrypted
    return finalItem
  }

  // Find all matching parameters from a collection
  // mongo.find('user', '58f9ds89fg9fe89f8ds98f9fj', { updatedAt: { $lt: new Date() }})
  // REF: https://stackoverflow.com/questions/2943222/find-objects-between-two-dates-mongodb
  async find(collectionName, userId, filters, pagination) {
    const needsEncrypt = !nonEncryptedCollections.includes(collectionName)
    if (!collectionName || !filters) throw 'Missing data for Find method!'
    // if (needsEncrypt && !userId) throw 'Missing userId!'
    if (!this.client) await this.connect()
    const Collection = this.client.db(getDbName()).collection(collectionName)
    let res, data, encryptKey

    try {
      res = await Collection.find(filters, pagination).toArray()
    } catch (e) {
      throw e
    }

    if (!res || res.length <= 0) return res
    if (!needsEncrypt) return res
    if (!userId) userId = res.length !== undefined ? res[0].userId : res.userId

    // TODO: Make this more efficient for multi-read!
    if (needsEncrypt && userId) {
      try {
        encryptKey = await this.getUserEncryptionKey(userId, filters.collection)
      } catch (e) {
        // return reject(e)
      }
      if (!encryptKey) throw 'Encryption key missing!'
    }

    return await Promise.all(res.map(async r => await this.getDecryptedPayload(collectionName, userId, r)))
  }

  // Update an item from a collection
  // mongo.delete('user', '58f9ds89fg9fe89f8ds98f9fj')
  async delete(collectionName, _id) {
    if (!collectionName || !_id) throw 'Missing data for Delete method!'
    if (!this.client) await this.connect()
    const Collection = this.client.db(getDbName()).collection(collectionName)
    let res

    try {
      res = await Collection.deleteOne({ _id: ObjectId(_id) })
    } catch (e) {
      throw e
    }

    if (res && res.result && res.result.ok !== 1) throw res
    return ObjectId(_id)
  }

  // Search for items based on a string
  // mongo.search('asset', 'name', 'app', { rank: 1 })
  async search(collectionName, field, str, options) {
    if (!collectionName || !field || !str) throw 'Missing data for Search method!'
    if (!this.client) await this.connect()
    const Collection = this.client.db(getDbName()).collection(collectionName)
    let res
    // const searchFilter = { $text: { $search: str }} // NOTE: Rigid, requires index
    const searchFilter = { [`${field}`]: { '$regex': str, '$options': 'i' }}

    try {
      res = await Collection.find(searchFilter, options).toArray()
    } catch (e) {
      throw e
    }

    if (res && res.result && res.result.ok !== 1) throw res
    return res
  }

  // create indexes for collections
  // mongo.index('user', { username : "text" })
  async index(collectionName, data, options) {
    if (!collectionName || !data) throw 'Missing data for Index method!'
    if (!this.client) await this.connect()
    const Collection = this.client.db(getDbName()).collection(collectionName)
    let res

    try {
      res = await Collection.createIndex(data, options)
    } catch (e) {
      throw e
    }

    if (res && res.result && res.result.ok !== 1) throw res
    return res
  }

}

module.exports = new MongoProvider()
