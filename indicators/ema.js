const EMA = require('trading-signals').EMA
const tools = require('../tools/index.js')
const POSITION = require('../tools/constants').POSITION_SIDE

const periodEma200 = 200
const periodEma50 = 50

function checkingEma (candles, period = 150) {
  const ema = new EMA(period)
  const candlesClose = tools.extractData(candles)
  candlesClose.forEach(price => {
    ema.update(price)
  })
  if (ema.isStable) {
    return ema.getResult().toPrecision(12)
  }
}

function validateEma200And50 (candles) {
  const ema200 = checkingEma(candles, periodEma200)
  const ema50 = checkingEma(candles, periodEma50)
  const data = { ema200, ema50, position: '' }
  if (ema200 < ema50) {
    data.position = POSITION.LONG
  } else {
    data.position = POSITION.SHORT
  }
  return data
}

module.exports = { checkingEma, validateEma200And50 }
