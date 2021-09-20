const tools = require('../tools/index.js')
const RSI = require('trading-signals').RSI
// const EMA = require('trading-signals').EMA

function checkingRsi (data, period = 14) {
  const rsi = new RSI(period)
  const dataClose = tools.extractData(data)
  const rsiArray = []
  dataClose.forEach(closePrice => {
    rsi.update(closePrice)
    if (rsi.isStable) {
      rsiArray.push(rsi.getResult().toPrecision(4))
    }
  })
  return rsiArray
}

module.exports = { checkingRsi }
