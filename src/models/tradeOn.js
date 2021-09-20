const mongoose = require('../database')

const TradeOnSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    lowercase: true
  },
  symbol: {
    type: String,
    required: true
  },
  tradeId: {
    type: Number
  },
  stopLossId: {
    type: Number
  },
  takeProfitId: {
    type: Number
  },
  strategy: {
    type: String,
    required: true
  },
  stopMarketPrice: {
    type: String,
    required: true
  },
  takeProfitPrice: {
    type: String,
    required: true
  },
  entryPrice: {
    type: String,
    required: true
  },
  quantity: {
    type: String,
    required: true
  },
  breakevenTriggerPrice: {
    type: String
  },
  riseStopTriggerPrice: {
    type: String
  },
  breakevenCreated: {
    type: Boolean,
    required: true,
    default: false
  },
  riseStopCreated: {
    type: Boolean,
    required: true,
    default: false
  },
  stopOrderCreated: {
    type: Boolean,
    required: true,
    default: false
  },
  profitOrderCreated: {
    type: Boolean,
    required: true,
    default: false
  },
  side: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = { TradeOnSchema }
