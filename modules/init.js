const path = require('path')
require('dotenv').config({ path: path.join(process.cwd(), '/secrets/.env') })
const { randomBytes, generateKeyPairSync } = require('crypto')
const {readFile: _readFile, writeFile: _writeFile} = require('fs')
const { sync } = require("glob")
const { promisify } = require('util')
const prompts = require('prompts')
const { bold, reset, underline } = require('kleur')

const readFile = promisify(_readFile);
const writeFile = promisify(_writeFile);

const KEY_NAME = 'jwtRS256'

const getToken = (size = 24) => randomBytes(size)
  .toString('hex')
  .slice(0, size)

const defaultUsername = getToken(12)
const defaultPass = getToken(36)

const confirmMessage = (_, values) => {
  return reset('You chose to use generated values make sure to save them in a safe location in order to access your database manually')
    + (values.MONGO_USERNAME === defaultUsername ? `\n\tUsername: ${bold(underline(defaultUsername))}` : '')
    + reset(values.MONGO_PASSWORD === defaultPass ? `\n\tPassword: ${bold(underline(defaultPass))}` : '')
    + bold('\n\n Are they safe?')
}

const questions = [
  {
    type: 'text',
    name: 'MONGO_USERNAME',
    message: 'What would you like your monogodb username to be?',
    initial: defaultUsername
  },
  {
    type: 'text',
    name: 'MONGO_PASSWORD',
    message: '...and your monogodb password?',
    initial: defaultPass
  },
  {
    type: (_, values) => values.MONGO_USERNAME === defaultUsername || values.MONGO_PASSWORD === defaultPass ? 'toggle' : null,
    name: 'confirm',
    message: confirmMessage,
    initial: false,
    active: 'yes',
    inactive: 'no'
  }
];
/**
 * Generates RSA key pair for use with JWTs within the web app.
 */
const generateKeys = () => {
  console.log("Generating keys...")

  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  })

  const privateKeyFile = `secrets/${KEY_NAME}.key`
  writeFile(privateKeyFile, privateKey).then( () => {
    console.log(`${privateKeyFile} created`)
  }).catch( err => {
     console.error("Couldn't create key", err)
  })

  const publicKeyFile = `secrets/${KEY_NAME}.key.pub`
  writeFile(publicKeyFile, publicKey).then( () => {
    console.log(`${publicKeyFile} created`)
  }).catch( err => {
    console.error("Couldn't create key", err)
  })
}

/**
 * Checks that the specified jwt keys to exist.
 * If keys are named incorrectly script will create them using the name
 * 'KEY_NAME' defined above.
 */
const checkIfKeysExist = () => {
  if(sync(`secrets/${KEY_NAME}*`).length === 2) {
    console.log(`Using keys ${KEY_NAME}.key and ${KEY_NAME}.key.pub`)
  } else {
    console.warn(`Keys ${KEY_NAME}.key and ${KEY_NAME}.key.pub not found.`)
    generateKeys()
  }
}

(async () => {
  // Check if JWT keys exist, if not create them
  checkIfKeysExist()

  try {
    // Check that an .env file exists, if it doesn't we'll create it using the example file
    let envFile = sync('secrets/.env').length === 1 ? await readFile('secrets/.env', 'utf-8') : await readFile('secrets/.env.example', 'utf-8')

    if(envFile.match(/FIRST_RUN=true/g)) {
      envFile = envFile.replace(/FIRST_RUN=true/g, 'FIRST_RUN=false')
    } else if(envFile.match(/FIRST_RUN=false/g)) {
      console.log(bold('👀 Looks like you are already setup! Just run the following command to get started:\n') + reset('docker-compose up\n'))
      return
    }

    console.log("Welcome to Hobby Hodlr 👋, let's get you up and running! 🙌")
    const response = await prompts(questions)

    let envFileUpdated = false

    // Check that mongo env vars exist and are defined
    const mongoVars = ['MONGO_USERNAME', 'MONGO_PASSWORD', 'MONGO_ENCRYPTION_KEY']
    mongoVars.map( envVar => {

      // Checking process.env will check both env set using export and env vars
      // in the .env loaded by dotenv above
      if(!process.env[envVar]) {

        const token = response[envVar] || getToken()

        // Matches an env var with or without the '='
        const re = new RegExp(`${envVar}=?.*`,'g')

        // If the var exists but is empty set the value. i.e. VAR=<empty>
        if(envFile.match(re) !== null) {
          envFile = envFile.replace(re, `${envVar}=${token}`)
        } else {
          // The var doesn't exist soo add the var to the end of the .env file
          envFile += `\n${envVar}=${token}\n`
        }
        envFileUpdated = true
      }
    })

    // Write .env file
    if(envFileUpdated) {
      await writeFile('secrets/.env', envFile)
    }

    console.log("\nPerfect! Looks like everything is set.\n")

    // This will signal the next command to execute using the '||' notation
    process.exit(0)
  } catch (err) {
    console.error('.env file does not exists or cannot read', err)
  }
})()
