const api = require('../services/api')
const ORDER_TYPE = require('../tools/constants').ORDER_TYPE
const { SIDE, TRADES_ON } = require('../tools/constants')
const telegram = require('../services/telegram')
const getAccountState = require('../states/account')

const symbolsProcessing = []

async function verifyRiseStop (account, data, trade) {
  let stopPrice
  if (symbolsProcessing.includes(trade[TRADES_ON.SYMBOL])) return
  else symbolsProcessing.push(trade[TRADES_ON.SYMBOL])
  console.log('symbolsProcessing - start', symbolsProcessing)
  if (trade[TRADES_ON.SIDE] === SIDE.BUY) {
    if (trade[TRADES_ON.RISE_STOP_PRICE] && trade[TRADES_ON.RISE_STOP_PRICE] < data.k.c) {
      console.log('riseStopFunction')
      stopPrice = trade[TRADES_ON.ENTRY_PRICE] > data.k.l ? trade.entryPrice : data.k.l

      await changeStopLoss(account, stopPrice, trade, TRADES_ON.RISE_STOP_CREATED)
    } else if (!trade[TRADES_ON.BREAKEVEN_CREATED] && trade[TRADES_ON.BREAKEVEN_PRICE] < data.k.c) {
      console.log('breakevenFunction')

      await changeStopLoss(account, trade[TRADES_ON.ENTRY_PRICE], trade, TRADES_ON.BREAKEVEN_CREATED)
    }
  } else if (trade[TRADES_ON.SIDE] === SIDE.SELL) {
    if (trade[TRADES_ON.RISE_STOP_PRICE] && trade[TRADES_ON.RISE_STOP_PRICE] > data.k.c) {
      console.log('riseStopFunction')
      stopPrice = trade[TRADES_ON.ENTRY_PRICE] < data.k.h ? trade[TRADES_ON.ENTRY_PRICE] : data.k.h
      await changeStopLoss(account, stopPrice, trade, TRADES_ON.RISE_STOP_CREATED)
    } else if (!trade[TRADES_ON.BREAKEVEN_CREATED] && trade[TRADES_ON.BREAKEVEN_PRICE] > data.k.c) {
      console.log('breakevenFunction')
      await changeStopLoss(account, trade[TRADES_ON.ENTRY_PRICE], trade, TRADES_ON.BREAKEVEN_CREATED)
    }
  } else return false
}

async function changeStopLoss (account, stopPrice, trade, operationType) {
  const { updateTradesOn } = await getAccountState(account)
  const { side, symbol } = trade
  const stopSide = side === SIDE.SELL ? SIDE.BUY : SIDE.SELL
  const typeId = operationType === TRADES_ON.BREAKEVEN_CREATED ? TRADES_ON.BREAKEVEN_ID : TRADES_ON.RISE_STOP_ID

  const openOrders = await api.getAllOpenOrders(account, symbol)
  if (openOrders[0]) {
    const hasStopLossOrder = openOrders.find(order => order.type === 'STOP_MARKET')
    const createdNewStopLoss = await createStopLossOrder()
    if (createdNewStopLoss && hasStopLossOrder) {
      await api.cancelOrder(account, symbol, hasStopLossOrder.orderId)
    }
  } else {
    await createStopLossOrder()
  }
  const symbolIndex = symbolsProcessing.findIndex(symb => symb === symbol)
  if (symbolIndex >= 0) symbolsProcessing.splice(symbolIndex, 1)
  console.log('symbolsProcessing - end', symbolsProcessing)

  async function createStopLossOrder () {
    const ordered = await api.newOrder(account, symbol, null, stopSide, ORDER_TYPE.STOP_MARKET, true, stopPrice)
    if (!ordered) {
      await updateTradesOn(symbol, operationType, false)
      telegram.sendMessage(account, `Problem MUDAR o ${ORDER_TYPE.STOP_MARKET} Order para ${symbol},
      conta: ${account},
      stop price: ${stopPrice}`, true)
      console.log(`Error CHANGING ${ORDER_TYPE.STOP_MARKET} order, stop price: ${stopPrice}`)
      return false
    } else {
      await updateTradesOn(symbol, operationType, true)
      await updateTradesOn(symbol, typeId, ordered.orderId)
      return true
    }
  }
}

module.exports = {
  changeStopLoss,
  verifyRiseStop
}
