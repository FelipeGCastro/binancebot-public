const mongoose = require('../database')

const TradeSchema = new mongoose.Schema({
  symbol: {
    type: String,
    require: true
  },
  account: {
    type: String,
    required: true
  },
  strategy: {
    type: String,
    required: true
  },
  side: {
    type: String,
    required: true
  },
  closePrice: {
    type: String,
    required: true
  },
  entryPrice: {
    type: String,
    required: true
  },
  stopPrice: {
    type: String,
    required: true
  },
  profitPrice: {
    type: String,
    required: true
  },
  quantity: {
    type: String,
    required: true
  },
  profit: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const Trade = mongoose.model('Trade', TradeSchema)

module.exports = Trade
