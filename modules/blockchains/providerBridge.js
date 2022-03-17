// NOTE: provider bridge should allow for any type of asset to have multiple providers supply data
const { getAdminSettings } = require('../dataHelpers')

const supportedChainSymbols = []

const providers = [
  require('../providers/algoexplorer'),
  require('../providers/amberdata'),
  require('../providers/blockchair'),
  require('../providers/cosmostation'),
  require('../providers/ethplorer'),
  require('../providers/near'),
  require('../providers/tezosorg'),
]

// loops an array of providers methods and executes
// eth: address => [
//   jsonrpc.eth.getBalances,
//   amberdata.eth.getBalances,
//   ethplorer.eth.getBalances,
//   blockchair.eth.getBalances,
// ]
// using recursion with try/catch promises
function methodProxy(fns, settings) {
  if (!fns || fns.length <= 0) return Promise.reject('No functions supported!')
  return async function(args) {
    let index = 0

    const executeFn = async fn => {
      try {
        return fn(args, settings)
      } catch (e) {
        // If we got an error, move on to the next provider
        if (index < fns.length) {
          index++
          return executeFn(fns[index])
        }

        // If no other providers, respond with error
        return Promise.reject(e)
      }
    }

    // Start with first function in array
    try {
      return executeFn(fns[index])
    } catch (e) {
      throw e
    }
  }
}

// Creates a generic way to request data from supported chains
const mapSupportedSymbolsToMethods = settings => {
  const methods = {}

  // loop all providers to figure out support
  for (const provider of providers) {

    if (provider.isSupported(settings)) {
      // loop all chains supported in a provider
      for (const chain in provider.chains) {
        if (!supportedChainSymbols.includes(chain)) supportedChainSymbols.push(chain)
        if (!methods[chain]) methods[chain] = {}

        // Loop all methods inside a chain to support them
        // map "bridge.eth.getBalances"
        for (const method in provider.chains[chain]) {
          const methodRaw = `${method}Raw`
          if (!methods[chain][method]) methods[chain][methodRaw] = []
          methods[chain][methodRaw].push(provider.chains[chain][method])

          // Assign the methodProxy IF there are supported methods
          if (methods[chain][methodRaw] && methods[chain][methodRaw].length > 0) {
            methods[chain][method] = methodProxy(methods[chain][methodRaw], settings)
          }
        }
      }
    }
  }

  return methods
}

module.exports = {
  supportedChainSymbols,
  blockchainProviders: async () => {
    const settings = await getAdminSettings()
    return mapSupportedSymbolsToMethods(settings)
  }
}
