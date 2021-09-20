const api = require('../services/api')
const Trade = require('../src/models/trade')
const telegram = require('../services/telegram')
const SIDE = require('../tools/constants').SIDE
const { POSITION_SIDE, TRADES_ON, ACCOUNT_PROP } = require('../tools/constants')
const { createTpandSLOrder } = require('./tpsl')
const getAccountState = require('../states/account')
const getExecuteState = require('../states/execute')

async function handleUserDataUpdate (data) {
  if (data.e === 'ORDER_TRADE_UPDATE') {
    if (data.o.X === 'FILLED') {
      const { getTradesOn, getAccountData } = await getAccountState(data.o.account)
      const symbols = getAccountData('symbols')
      if (!symbols.includes(data.o.s)) return
      const tradesOn = getTradesOn()
      const trade = tradesOn.find(trade => trade.symbol === data.o.s)
      if (trade) tpslOrderFilled({ ...data.o, trade })
      else createTradesOn(data)
    }
    console.log('order status: ', data.o.X, 'order symbol: ', data.o.s)
  }
}

async function createTradesOn (data) {
  console.log('createTradesOn')
  const { getTradesOn, setAccountData, setTradesOn, getAccountData } = await getAccountState(data.o.account)
  const tradesOn = getTradesOn()
  const accountData = getAccountData()
  const result = data.o.getStopAndTargetPrice(data.o.L, data.o.S, data.o.s)
  setAccountData(ACCOUNT_PROP.LIMIT_REACHED, (tradesOn.length + 1) >= accountData.limitOrdersSameTime)
  const trade = {
    [TRADES_ON.SYMBOL]: data.o.s,
    [TRADES_ON.STOP_PRICE]: result.stopPrice,
    [TRADES_ON.PROFIT_PRICE]: result.targetPrice,
    [TRADES_ON.ENTRY_PRICE]: data.o.L,
    [TRADES_ON.SIDE]: data.o.S,
    [TRADES_ON.STRATEGY]: result.strategy,
    [TRADES_ON.BREAKEVEN_PRICE]: result.breakevenTriggerPrice,
    [TRADES_ON.TRADE_ID]: data.o.i,
    [TRADES_ON.QUANTITY]: data.o.z
  }
  if (result.riseStopTriggerPrice) trade[TRADES_ON.RISE_STOP_PRICE] = result.riseStopTriggerPrice
  setTradesOn(trade)
  telegram.sendMessage(data.o.account, `Entrou: ${data.o.s}PERP, Side: ${data.o.S}, Strategy: ${accountData.strategy}, account: ${data.o.account}`)
  createTpandSLOrder({ ...data.o, trade })
}

// async function handleCheckOrders (data, trade) {
//   if (data.o.X === 'FILLED') {
//     if (data.o.i === trade[TRADES_ON.STOP_LOSS_ID] ||
//     data.o.i === trade[TRADES_ON.TAKE_PROFIT_ID] ||
//     data.o.i === trade[TRADES_ON.BREAKEVEN_ID] ||
//     data.o.i === trade[TRADES_ON.RISE_STOP_ID]) tpslOrderFilled({ ...data.o, trade })
//     else if (trade.symbol === data.o.s) tpslOrderFilled({ ...data.o, trade })
//   }
// }

async function tpslOrderFilled (order) {
  console.log('Stop or Profit Order was triggered')
  telegram.sendMessage(order.account, `PNL: ${order.rp}, conta: ${order.account}`)
  const { removeFromTradesOn } = await getAccountState(order.account)
  const isGain = order.rp > 0
  const data = {
    symbol: order.trade.symbol,
    side: order.S === SIDE.SELL ? POSITION_SIDE.LONG : POSITION_SIDE.SHORT,
    closePrice: order.L,
    entryPrice: order.trade.entryPrice,
    stopPrice: isGain ? order.trade.stopMarketPrice : order.L,
    profitPrice: isGain ? order.L : order.trade.takeProfitPrice,
    quantity: order.q,
    profit: order.rp,
    timestamp: order.T,
    strategy: order.trade.strategy,
    account: order.account
  }
  removeFromTradesOn(order.trade.symbol)
  const trade = await Trade.create(data)
  if (!trade) console.log('Cannot create trade')
  const ordersCancelled = await api.cancelAllOrders(order.account, order.trade.symbol)
  if (!ordersCancelled) console.log('Problems to cancel orders')
  verifyBalance(order.account)
}

async function verifyBalance (account) {
  const { getTradesDelayed, turnBotOn, getAccountData } = await getAccountState(account)
  const { resetListenersAndCandles } = await getExecuteState(account)
  const tradesOn = await getTradesDelayed()
  if (tradesOn.length === 0) {
    const limitLoss = getAccountData(ACCOUNT_PROP.LIMIT_LOSS)
    const balanceData = await api.getBalance(account)
    const balance = balanceData.filter((coin) => (coin.asset === 'USDT'))[0].availableBalance
    if (balance < limitLoss) {
      turnBotOn(false)
      resetListenersAndCandles()
      telegram.sendMessage(account, `Atingiu seu maximo de perda! Parei o Bot! ${account}`)
    }
  }
}

module.exports = {
  handleUserDataUpdate
}
