const api = require('../services/api')
let exchangeInfo
async function getQtyRules (symbol) {
  if (!exchangeInfo) {
    exchangeInfo = await api.exchangeInfo()
    if (!exchangeInfo) return false
  }
  const symbolData = exchangeInfo.symbols.find(data => data.symbol === symbol)
  const filter = symbolData.filters.find(filter => filter.filterType === 'LOT_SIZE')
  if (!!filter.stepSize && !!filter.minQty) {
    return {
      qtyFormat: filter.stepSize,
      minQty: filter.minQty
    }
  } else return false
}

async function getAllSymbols () {
  if (!exchangeInfo) {
    exchangeInfo = await api.exchangeInfo()
    if (!exchangeInfo) {
      console.error('Error getting exchange info.')
      return false
    }
  }
  const allSymbols = exchangeInfo.symbols.map(data => data.symbol)
  return allSymbols
}

module.exports = {
  getQtyRules,
  getAllSymbols
}
