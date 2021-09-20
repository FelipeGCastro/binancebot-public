function extractData (dataArray, index = 'CLOSE') {
  const type = {
    CLOSE: 4,
    HIGH: 2,
    LOW: 3
  }
  const data = []
  dataArray.forEach(candle => {
    const close = Number(candle[type[index]])
    data.push(close)
  })
  return data
}

// 1 - 4
function isRedCandle (candle) {
  return candle[1] > candle[4]
}
// 1 - 4
function isBlueCandle (candle) {
  return candle[1] < candle[4]
}

function getTpAndSlByPer (price, side, stopPerc = 0.5, takeProfPerc = 1) {
  const isSell = side === 'SELL'
  const stopPrice = isSell ? parseFloat(price) + (price * (stopPerc / 100)) : price - (price * (stopPerc / 100))
  const takeProfitPrice = isSell ? price - (price * (takeProfPerc / 100)) : parseFloat(price) + (price * (stopPerc / 100))
  return { stopPrice: priceMirrorFormat(stopPrice, price), takeProfitPrice: priceMirrorFormat(takeProfitPrice, price) }
}

function handleStopPercentage (price, stopPrice, side, minPercentage = 0.2) {
  const perc = getPercentage(price, stopPrice)
  let newStopPrice
  if (side === 'SELL') {
    if (perc < minPercentage || price > stopPrice) {
      newStopPrice = parseFloat(price) + (price * (minPercentage / 100))
    } else {
      newStopPrice = stopPrice
    }
  } else {
    if (perc < minPercentage || price < stopPrice) {
      newStopPrice = price - (price * (minPercentage / 100))
    } else {
      newStopPrice = stopPrice
    }
  }

  return priceMirrorFormat(newStopPrice, price)
}

function getPercentage (from, to) {
  const decreaseValue = from - to
  return Math.abs((decreaseValue / from) * 100)
}

function getTargetPrice (price, stopPrice) {
  let targetPrice
  const isSell = price < stopPrice
  const perc = getPercentage(price, stopPrice) * 2
  if (isSell) {
    targetPrice = price - (price * (perc / 100))
  } else {
    targetPrice = parseFloat(price) + (price * (perc / 100))
  }
  return priceMirrorFormat(targetPrice, price)
}

function priceMirrorFormat (number, format) {
  const isString = typeof format === 'string'
  const formatArray = (isString ? format : toString(format)).split('.')
  const decimals = formatArray[1].length ? formatArray[1].length : 2
  const formatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: false })

  return Number(formatter.format(parseFloat(number)))
}

function ParseFloat (str, val) {
  str = str.toString()
  str = str.slice(0, (str.indexOf('.')) + val + 1)
  return Number(str)
}

function ParseFloatByFormat (str, formatDecimals) {
  const checkDecimals = formatDecimals.toString().split('.')
  const decimals = checkDecimals[1] ? checkDecimals[1].length : 0
  str = str.toString()
  const formatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: false })

  return formatter.format(Number(str))
}

function getLasts (data, amount) {
  return data.slice(Math.max(data.length - amount, 1))
}
function getFirsts (data, amount) {
  return data.slice(0, amount)
}

// NEED TO FIND A WAY TO FORMAT NUMBERS BY COIN FORMAT

module.exports = {
  extractData,
  getLasts,
  getFirsts,
  isRedCandle,
  isBlueCandle,
  getTargetPrice,
  priceMirrorFormat,
  getTpAndSlByPer,
  ParseFloat,
  ParseFloatByFormat,
  handleStopPercentage,
  getPercentage
}
