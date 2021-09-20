const Stochastic = require('technicalindicators').Stochastic
const tools = require('../tools/index.js')

function checkingStoch (data, period = 14) {
  const dataClose = tools.extractData(data)
  const dataHigh = tools.extractData(data, 'HIGH')
  const dataLow = tools.extractData(data, 'LOW')
  const input = {
    high: dataHigh,
    low: dataLow,
    close: dataClose,
    period,
    signalPeriod: 3,
    smoothing: 3,
    format: n => tools.ParseFloat(n, 2)
  }
  const stoch = Stochastic.calculate(input)

  return stoch
}

module.exports = { checkingStoch }
