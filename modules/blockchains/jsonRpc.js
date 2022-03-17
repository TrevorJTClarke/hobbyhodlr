const axios = require('axios')
const utils = require('../utils')

const getId = () => `${+new Date()}${utils.getRand(10, 10000)}`

const formatJsonRpcPayload = (id, method, params) => {
  const data = {
    jsonrpc: '2.0',
    method,
    params,
    id,
  }
  return JSON.stringify(data)
}

const parseJsonRpcPaylod = data => {
  return data && data.result ? data.result : data
}

const query = async ({ config, method, params }) => {
  const id = getId()
  const url = `${config.baseUrl}${config.path || ''}`
  const payload = formatJsonRpcPayload(id, method, params)
  const options = { headers: { 'Content-Type': 'application/json; charset=utf-8' }}

  try {
    const { data } = await axios.post(url, payload, options)
    return parseJsonRpcPaylod(data)
  } catch (e) {
    throw e
  }
}

module.exports = {
  query,
}
