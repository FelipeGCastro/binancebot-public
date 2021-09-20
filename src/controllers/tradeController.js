const express = require('express')
const Trade = require('../models/trade')

const tradeRoutes = express.Router()

tradeRoutes.get('/', async (req, res) => {
  const trades = await Trade.find({})
  res.send(trades)
})

module.exports = tradeRoutes
