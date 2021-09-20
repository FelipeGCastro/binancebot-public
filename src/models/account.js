const mongoose = require('../database')
const { TradeOnSchema } = require('./tradeOn')

const AccountSchema = new mongoose.Schema({
  type: {
    type: String,
    unique: true,
    required: true,
    lowercase: true
  },
  strategy: {
    type: String,
    required: true
  },
  symbols: {
    type: [String],
    required: true
  },
  botOn: {
    type: Boolean,
    required: true,
    default: false
  },
  leverage: {
    type: Number,
    required: true
  },
  entryValue: {
    type: Number,
    required: true
  },
  maxEntryValue: {
    type: Number,
    required: true
  },
  limitLoss: {
    type: Number
  },
  limitOrdersSameTime: {
    type: Number,
    required: true
  },
  limitReached: {
    type: Boolean,
    required: true,
    default: false
  },
  listenKeyIsOn: {
    type: Boolean,
    required: true,
    default: false
  },
  tradesOn: [TradeOnSchema],
  onlyErrorMessages: {
    type: Boolean,
    require: true,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const Account = mongoose.model('Account', AccountSchema)

module.exports = Account
