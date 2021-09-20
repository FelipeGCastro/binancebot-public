const WebSocket = require('ws')
const { sendMessage } = require('./telegram')
const wsUrl = process.env.WS_BASE_URL

const streams = {
  depth: symbol => `${symbol.toLowerCase()}@depth`,
  depthLevel: (symbol, level) =>
      `${symbol.toLowerCase()}@depth${level}`,
  kline: (symbol, interval) =>
      `${symbol.toLowerCase()}@kline_${interval}`,
  klineContinuos: (symbol, interval) =>
      `${symbol.toLowerCase()}_perpetual@continuousKline_${interval}`,
  aggTrade: symbol => `${symbol.toLowerCase()}@aggTrade`,
  bookTicker: symbol => `${symbol.toLowerCase()}@bookTicker`,
  ticker: symbol => `${symbol.toLowerCase()}@ticker`,
  allTickers: () => '!ticker@arr'
}

function setupWebSocket (eventHandler, path, account = null) {
  path = `${wsUrl}${path}`
  const ws = new WebSocket(path)

  ws.on('message', message => {
    let event
    try {
      event = JSON.parse(message)
    } catch (e) {
      event = message
    }
    eventHandler(event)
  })

  ws.on('error', (error) => {
    console.log(error)
    if (account) {
      sendMessage(account, `ERRO - na conta: ${account}, websocket deu erro.`, true)
    }
  })
}

function listenKey (key, eventHandler, account) {
  return setupWebSocket(eventHandler, key, account)
}

function onDepthLevelUpdate (symbol, level, eventHandler) {
  return setupWebSocket(
    eventHandler,
    streams.depthLevel(symbol, level)
  )
}

function onKline (symbol, interval, eventHandler) {
  return setupWebSocket(
    eventHandler,
    streams.kline(symbol, interval)
  )
}
function onKlineContinuos (symbol, interval, eventHandler) {
  return setupWebSocket(
    eventHandler,
    streams.klineContinuos(symbol, interval)
  )
}

function onBookTicker (symbol, eventHandler) {
  return setupWebSocket(
    eventHandler,
    streams.bookTicker(symbol)
  )
}

module.exports = {
  setupWebSocket,
  onDepthLevelUpdate,
  onKline,
  onKlineContinuos,
  onBookTicker,
  listenKey
}

// @bookTicker
