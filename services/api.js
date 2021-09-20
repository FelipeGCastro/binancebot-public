const axios = require('axios')
const querystring = require('querystring')
const crypto = require('crypto')
const { ACCOUNTS_TYPE } = require('../tools/constants')
const { sendMessage } = require('./telegram')

const apikeyPrimary = process.env.API_KEY
const apiSecretPrimary = process.env.SECRET_KEY
const apikeySecondary = process.env.API_KEY_SECOND
const apiSecretSecondary = process.env.SECRET_KEY_SECOND
const apiUrl = process.env.API_URL

async function privateCall (account, path, data = {}, method = 'GET') {
  let apikey, apiSecret
  if (account === ACCOUNTS_TYPE.PRIMARY) {
    if (!apikeyPrimary && !apiSecretPrimary) return false
    apikey = apikeyPrimary
    apiSecret = apiSecretPrimary
  } else if (account === ACCOUNTS_TYPE.SECONDARY) {
    if (!apikeySecondary && !apiSecretSecondary) return false
    apikey = apikeySecondary
    apiSecret = apiSecretSecondary
  } else return false
  const timestamp = Date.now()
  const signature = crypto.createHmac('sha256', apiSecret)
    .update(`${querystring.stringify({ ...data, timestamp })}`).digest('hex')
  const newData = { ...data, timestamp, signature }
  const qs = `?${querystring.stringify(newData)}`

  try {
    const result = await axios({
      method,
      url: `${apiUrl}${path}${qs}`,
      headers: { 'X-MBX-APIKEY': apikey }
    })
    return result.data
  } catch (error) {
    if (error.response?.data?.code) {
      sendMessage(account, `code: ${error.response?.data?.code}, mensagem: ${error.response?.data?.msg}, conta: ${account}`, true)
      console.error(`code: ${error.response?.data?.code}, mensagem: ${error.response?.data?.msg}, conta: ${account}`)
    } else {
      console.log(error)
    }

    return false
  }
}

async function newOrder (account, symbol, quantity, side = 'BUY', type = 'MARKET', closePosition = false, stopPrice = null) {
  const data = {
    symbol,
    side,
    type,
    closePosition
  }
  if (quantity) data.quantity = quantity
  if (stopPrice) data.stopPrice = stopPrice

  return privateCall(account, '/fapi/v1/order', data, 'POST')
}

async function cancelAllOrders (account, symbol) {
  return privateCall(account, '/fapi/v1/allOpenOrders', { symbol }, 'DELETE')
}

async function cancelOrder (account, symbol, orderId, origClientOrderId) {
  const data = { symbol }
  if (orderId) data.orderId = orderId
  if (origClientOrderId) data.origClientOrderId = origClientOrderId
  if (data.orderId || data.origClientOrderId) {
    return privateCall(account, '/fapi/v1/order', data, 'DELETE')
  } else {
    console.error('orderId or origClientOrderId is Require!')
    return false
  }
}

async function publicCall (path, data, method = 'GET') {
  try {
    const qs = data ? `?${querystring.stringify(data)}` : ''
    const result = await axios({
      method,
      url: `${apiUrl}${path}${qs}`
    })
    return result.data
  } catch (error) {
    console.error(error)
  }
}

async function time () {
  return publicCall('/fapi/v1/time')
}

async function candles (pair, interval = '1m', limit = 300) {
  return publicCall('/fapi/v1/continuousKlines',
    { pair, contractType: 'PERPETUAL', interval, limit })
}

async function depth (symbol, limit = 5) {
  return publicCall('/fapi/v1/depth', { symbol, limit })
}

async function accountInfo (account) {
  return privateCall(account, '/fapi/v1/account')
}

async function listenKey (account) {
  return privateCall(account, '/fapi/v1/listenKey', false, 'POST')
}

async function changeLeverage (account, leverage, symbol) {
  return privateCall(account, '/fapi/v1/leverage', { symbol, leverage }, 'POST')
}

async function getBalance (account) {
  return privateCall(account, '/fapi/v2/balance')
}

async function getAccountInfo (account) {
  return privateCall(account, '/fapi/v2/account')
}

async function exchangeInfo () {
  return publicCall('/fapi/v1/exchangeInfo')
}

async function getAllOpenOrders (account, symbol) {
  const data = { symbol }
  return privateCall(account, '/fapi/v1/openOrders', data)
}

module.exports = {
  time,
  depth,
  exchangeInfo,
  accountInfo,
  candles,
  listenKey,
  getBalance,
  changeLeverage,
  newOrder,
  cancelAllOrders,
  cancelOrder,
  getAllOpenOrders,
  getAccountInfo
}
