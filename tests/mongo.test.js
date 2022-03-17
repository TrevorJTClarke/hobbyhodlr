const test = require('ava')
const mongo = require('../modules/mongo')
const { getUsers } = require('../modules/dataHelpers')

const getTableName = name => {
	return `${mongo.DBNAMES[name]}TEST`
}

const setupUser = async () => {
	await mongo.connect()
	const collection = mongo.client.db(mongo.dbName).collection(getTableName('user'))
	const users = await collection.find({}).toArray()
	const user = { ...users[0], passcode: '1234Xyz!', username: 'avatest', salt: 'p4s$th3BEEF', fake: 'data' }
	if (!user._id || !users.length) {
		const encryptedUser = await mongo.getEncryptedPayload(getTableName('user'), null, user)
		const newUser = await collection.insertOne(encryptedUser, {})
		user._id = newUser.ops[0]._id
	}
	return user
}

test.before(async t => {
	t.context.user = await setupUser()
})

test('Mongo: Connect', async t => {
	const testUri = `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOSTNAME}/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority&authMechanism=DEFAULT&authSource=admin`
	t.is(mongo.uri, testUri)
	const db = await mongo.connect()
	t.is(typeof db, 'object')
})

test('Mongo: Encrypted Payload', async t => {
	const payload = await mongo.getEncryptedPayload(getTableName('user'), t.context.user._id, { ...t.context.user, testing: true })
	t.not(payload.encrypted, undefined)
})

test('Mongo: Decrypted Payload', async t => {
	const test = await mongo.getEncryptedPayload(getTableName('user'), `${t.context.user._id}`, { ...t.context.user, testing: true })
	const payload = await mongo.getDecryptedPayload(getTableName('user'), t.context.user._id, { ...t.context.user, encrypted: test.encrypted })
	t.is(payload.testing, true)
})

test('Mongo: User Encryption Key', async t => {
	const res = await mongo.getUserEncryptionKey(t.context.user._id, getTableName('user'))
	t.is(res.key, '1234Xyz!')
	t.is(res.salt, 'p4s$th3BEEF')
})

test('Mongo: Add', async t => {
	const data = { ...t.context.user, name: 'test', symbol: 'TST' }
	delete data._id
	delete data.encrypted
	const res = await mongo.add(getTableName('asset'), t.context.user._id, data)
	t.is(res.length, 1)
	t.is(res[0].encrypted, undefined)
	t.is(res[0].fake, 'data')
})

test('Mongo: Get', async t => {
	const res = await mongo.get(getTableName('user'), t.context.user._id, t.context.user)
	t.is(`${res._id}`, `${t.context.user._id}`)
	t.is(res.username, 'avatest')
})

test('Mongo: Update', async t => {
	const res = await mongo.update(getTableName('user'), t.context.user._id, { ...t.context.user, newField: true })
	t.is(res.newField, true)
	t.is(res.encrypted, undefined)
	const res2 = await mongo.update(getTableName('user'), t.context.user._id, { ...res, world: 'hello' })
	t.is(res2.newField, true)
	t.is(res2.world, 'hello')
	t.is(res2.encrypted, undefined)
})

test('Mongo: Find', async t => {
	const res = await mongo.find(getTableName('user'), t.context.user._id, { ...mongo.ObjectId(t.context.user._id), collection: getTableName('user') })
	t.is(res[0].username, 'avatest')
})

test('Mongo: Delete', async t => {
	const items = await mongo.add(getTableName('asset'), t.context.user._id, { fake: 'data' })
	await mongo.delete(getTableName('asset'), items[0]._id)
	const res = await mongo.get(getTableName('asset'), t.context.user._id, mongo.ObjectId(items[0]._id))
	t.is(res, null)
})

test('Mongo: Search', async t => {
	// add values to search for
	await mongo.index(getTableName('asset'), { t: "text" })
	await Promise.all([{ t: 'hi' }, { t: 'pedro' }, { t: 'nice campaign napoleon' }].map(async i => await mongo.add(getTableName('asset'), t.context.user._id, i)))

	// actually search
	const s1 = await mongo.search(getTableName('asset'), 't', 'pedro')
	const s2 = await mongo.search(getTableName('asset'), 't', 'nap')
	t.is(s1[0].t, 'pedro')
	t.is(s2[0].t, 'nice campaign napoleon')
})

test('Mongo: Index', async t => {
	try {
		await mongo.index(getTableName('assetSeries'), { timestamp: 1 }, { unique: true })
		t.true(true)
	} catch (e) {
		t.true(e)
	}
})
