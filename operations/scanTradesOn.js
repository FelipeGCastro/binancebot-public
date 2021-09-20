const api = require('../services/api.js')
const { sendMessage } = require('../services/telegram.js')
const getAccountState = require('../states/account')
const { ACCOUNT_PROP, ORDER_TYPE, TRADES_ON, SIDE } = require('../tools/constants.js')

async function scanTradesOn (account, execute) {
  const { removeFromTradesOn, getAccountData } = await getAccountState(account)
  const tradesOn = getAccountData(ACCOUNT_PROP.TRADES_ON)
  if (tradesOn.length > 0) {
    const accountInfo = await api.getAccountInfo(account)
    tradesOn.forEach(async trade => {
      const tradeOn = accountInfo.positions.find(pos => pos.symbol === trade.symbol)
      if (!tradeOn) removeFromTradesOn(trade.symbol)
      else {
        if (!trade.stopMarketPrice || !trade.takeProfitPrice) return false
        const openOrders = await api.getAllOpenOrders(account, trade.symbol)
        const orderIsSell = trade.side === SIDE.SELL
        const side = orderIsSell ? SIDE.BUY : SIDE.SELL
        if (openOrders[0]) {
          const hasStopLossOrder = openOrders.find(order => order.type === 'STOP_MARKET')
          const hasTakeProfitOrder = openOrders.find(order => order.type === 'TAKE_PROFIT_MARKET')

          if (!hasStopLossOrder) await createOrder(account, ORDER_TYPE.STOP_MARKET, trade.stopMarketPrice, trade.symbol, side)
          if (!hasTakeProfitOrder) await createOrder(account, ORDER_TYPE.TAKE_PROFIT_MARKET, trade.takeProfitPrice, trade.symbol, side)
        } else {
          const isStopLossCreated = await createOrder(account, ORDER_TYPE.STOP_MARKET, trade.stopMarketPrice, trade.symbol, side)
          const isTakeProfitCreated = await createOrder(account, ORDER_TYPE.TAKE_PROFIT_MARKET, trade.takeProfitPrice, trade.symbol, side)
          return isStopLossCreated && isTakeProfitCreated
        }
      }
    })
  }
}

async function createOrder (account, type, price, symbol, side) {
  const { updateTradesOn } = await getAccountState(account)
  const ordered = await api.newOrder(account, symbol, null, side, type, true, price)
  const tradesOnKey = type === ORDER_TYPE.TAKE_PROFIT_MARKET ? TRADES_ON.PROFIT_CREATED : TRADES_ON.STOP_CREATED
  if (!ordered) {
    await updateTradesOn(symbol, tradesOnKey, false)
    sendMessage(account, `Problem ao criar ${type} Order para ${symbol}`)
    console.log(`Error creating ${type} order`)
    return false
  } else {
    await updateTradesOn(symbol, tradesOnKey, true)
    return true
  }
}

module.exports = scanTradesOn
