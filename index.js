const api = require('./services/api.js')
const operations = require('./operations/userDataUpdate')
const ws = require('./services/ws.js')
const telegram = require('./services/telegram')
const newOrder = require('./operations/newOrder')
const { TRADES_ON, ACCOUNTS_TYPE } = require('./tools/constants')
const { verifyRiseStop } = require('./operations/changeStopLoss.js')
const getAccountState = require('./states/account')
const getExecuteState = require('./states/execute.js')
const checkAccountOnStart = require('./operations/accountOnStart.js')

// let allCandles = []

checkAccountOnStart(ACCOUNTS_TYPE.PRIMARY, execute)
checkAccountOnStart(ACCOUNTS_TYPE.SECONDARY, execute)

// START MAIN FUNCTION
async function execute (account) {
  const { getState, setState, addToStateArray, updateAllCandles } = await getExecuteState(account)
  const { getAccountData, getTradesOn, updateListenKeyIsOn } = await getAccountState(account)
  const accountdata = getAccountData()
  telegram.sendMessage(account, `Bot Foi Iniciado ou Reiniciado, conta: ${account}`)
  const isLeverageChanged = await changeLeverage(account)
  if (!isLeverageChanged) return false

  accountdata.symbols.forEach((symbol) => {
    if (!symbol) return
    addAllCandles(symbol)
    setWsListeners(symbol)
  })

  async function addAllCandles (symbol) {
    const candles = await api.candles(symbol, getState('interval'))
    if (candles) addToStateArray('allCandles', { candles, symbol })
    else console.log('error on get Candles')
  }

  async function setWsListeners (symbol) {
    let lastEventAt = 0
    // LISTEN CANDLES AND UPDTATE CANDLES WHEN CANDLE CLOSE
    const listener = await ws.onKlineContinuos(symbol, getState('interval'), async (data) => {
      if (data.k.x && data.E > lastEventAt) {
        lastEventAt = data.E
        await handleCloseCandle(data, symbol)
      }
      analysingCandle(data, symbol)
    })
    addToStateArray('candlesListeners', { listener, symbol })
  }

  async function analysingCandle (data, symbol) {
    const tradesOn = getTradesOn()
    const hasTradeOn = tradesOn.find(trade => trade.symbol === symbol)
    if (hasTradeOn && hasTradeOn[TRADES_ON.BREAKEVEN_PRICE] && !hasTradeOn[TRADES_ON.RISE_STOP_CREATED]) {
      await verifyRiseStop(account, data, hasTradeOn)
    }
  }

  async function handleCloseCandle (data, symbol) {
    const accountData = getAccountData()
    const allCandles = getState('allCandles')
    const validateEntry = getState('validateEntry')
    const candlesObj = allCandles.find(cand => cand.symbol === symbol)
    const tradesOn = getTradesOn()

    if (!candlesObj) return
    const hasTradeOn = tradesOn.find(trade => trade.symbol === candlesObj.symbol)
    const newCandles = await handleAddCandle(data, candlesObj)
    if (!hasTradeOn &&
        !accountData.limitReached &&
        accountData.listenKeyIsOn &&
        accountData.botOn) {
      const valid = await validateEntry(newCandles, symbol)
      console.log('Fechou!', candlesObj.symbol)

      if (valid && valid.symbol === candlesObj.symbol) {
        await newOrder.handleNewOrder({
          ...valid,
          entryValue: accountData.entryValue,
          maxEntryValue: accountData.maxEntryValue,
          symbol,
          account
        })
        console.log('Entry is Valid')
      }
    }
  }

  function handleAddCandle (data, candlesObj) {
    const allCandles = getState('allCandles')
    const candles = candlesObj.candles
    const newCandle = [data.k.t, data.k.o, data.k.h, data.k.l, data.k.c, data.k.v, data.k.T, data.k.q, data.k.n, data.k.V, data.k.Q]
    if (newCandle[0] === candles[candles.length - 1][0]) {
      candles.pop()
    } else {
      candles.shift()
    }
    candles.push(newCandle)
    const candlesFiltered = allCandles.filter(candlesObjItem => candlesObjItem.symbol !== candlesObj.symbol)
    candlesFiltered.push({ candles, symbol: candlesObj.symbol })
    updateAllCandles(candlesFiltered)
    return candles
  }

  getListenKey()

  async function getListenKey () {
    const data = await api.listenKey(account)
    if (data) {
      setWsListen(data.listenKey)
      updateListenKeyIsOn(true)
    } else {
      console.log('Error getting listenKey, try again e 10 seconds')
      const keyInterval = setInterval(async () => {
        const data = await api.listenKey(account)
        if (data) {
          setWsListen(data.listenKey)
          updateListenKeyIsOn(true)
          clearInterval(keyInterval)
        } else {
          telegram.sendMessage(account, `Problemas ao buscar uma ListenKey, nova tentativa em 10 segundos, conta: ${account}`)
          console.log('Problemas ao buscar uma ListenKey, nova tentativa em 10 segundos')
        }
      }, 10000)
    }
  }

  async function setWsListen (listenKey) {
    const accountData = getAccountData()
    const wsListenKey = ws.listenKey(listenKey, async (data) => {
      if (data.e === 'listenKeyExpired' && accountData.listenKeyIsOn) {
        updateListenKeyIsOn(false)
        wsListenKey.close()
        await getListenKey()
      } else {
        let newData
        if (data.o) {
          const dataOrder = { ...data.o, account, getStopAndTargetPrice: handleParamsGetTpSl }
          newData = { ...data, o: dataOrder }
        } else { newData = { ...data, account } }
        await operations.handleUserDataUpdate(newData)
      }
    }, account)
    setState('userDataListeners', wsListenKey)
  }

  function handleParamsGetTpSl (entryPrice, positionSideOrSide, symbol) {
    const allCandles = getState('allCandles')
    const strategy = getAccountData('strategy')
    const candlesObj = allCandles.find(cand => cand.symbol === symbol)
    const getStopAndTargetPrice = getState('getStopAndTargetPrice')
    const result = getStopAndTargetPrice(candlesObj.candles, entryPrice, positionSideOrSide)
    result.strategy = strategy
    console.log('handleParamsGetTpSl - result', result)
    return result
  }
}

async function changeLeverage (account) {
  const { getAccountData } = await getAccountState(account)
  const accountData = getAccountData()
  accountData.symbols.forEach(async (symbol) => {
    const changedLeverage = await api.changeLeverage(account, accountData.leverage, symbol)
    if (!changedLeverage) {
      console.log('Error when change Leverage')
      return false
    }
    console.log('Leverage Changed Successfully: ', symbol)
  })
  return true
}
// END OF EXECUTE FUCTION

module.exports = {
  execute,
  changeLeverage
}
