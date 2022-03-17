const path = require('path')
require('dotenv').config({ path: path.join(process.cwd(), '/secrets/.env') })
const fs = require('fs')

const keyPath = process.env.DOCKER === 'true' ? '/run/secrets/' : './secrets/'

const privateKey = fs.readFileSync(path.join(keyPath, 'jwtRS256.key'), 'utf-8')
const publicKey = fs.readFileSync(path.join(keyPath, 'jwtRS256.key.pub'), 'utf-8')

module.exports = {
  privateKey,
  publicKey,
}
