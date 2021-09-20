const express = require('express')
const Account = require('../models/account')
const { STRATEGIES, ACCOUNTS_TYPE, ACCOUNT_PROP } = require('../../tools/constants')
const api = require('../../services/api')
const helpers = require('../../helpers/index')
const getAccountState = require('../../states/account')
const { execute, changeLeverage } = require('../../index')
const getExecuteState = require('../../states/execute')

const accountRoutes = express.Router()

async function checkAccounts () {
  const Accounts = await Account.find({})
  if (!Accounts[0]) {
    await Account.create([{
      type: ACCOUNTS_TYPE.PRIMARY,
      strategy: STRATEGIES.SHARK,
      symbols: ['ADAUSDT', 'DOGEUSDT', 'AKROUSDT', 'XRPUSDT'],
      leverage: 5,
      entryValue: 100,
      maxEntryValue: 120,
      limitLoss: 80,
      limitOrdersSameTime: 4
    },
    {
      type: ACCOUNTS_TYPE.SECONDARY,
      strategy: STRATEGIES.SHARK,
      symbols: ['ADAUSDT', 'DOGEUSDT', 'LINAUSDT', 'C98USDT'],
      leverage: 5,
      entryValue: 100,
      maxEntryValue: 120,
      limitLoss: 80,
      limitOrdersSameTime: 4
    }])
  }
}
checkAccounts()

accountRoutes.get('/:account', async (req, res) => {
  const { account } = req.params
  const { getAccountData } = await getAccountState(account)
  return res.send(getAccountData())
})

accountRoutes.get('/:account/strategies', async (req, res) => {
  console.log('requested strategies')
  return res.send(STRATEGIES)
})

accountRoutes.get('/:account/symbols', async (req, res) => {
  const exchangeInfo = await api.exchangeInfo()
  const allSymbols = exchangeInfo.symbols.map(data => data.symbol)
  return res.send(allSymbols)
})

accountRoutes.put('/:account/symbols', async (req, res) => {
  const { account } = req.params
  const { symbols } = req.body
  const { getAccountData, getTradesOn, setAccountData } = await getAccountState(account)
  if (account !== ACCOUNTS_TYPE.PRIMARY && account !== ACCOUNTS_TYPE.SECONDARY) { return res.status(400).send({ error: 'Bad type' }) }
  if (!Array.isArray(symbols)) return res.status(400).send({ error: 'Bad type' })
  if (symbols.length > 5) return res.status(400).send({ error: 'Max symbols is 5' })
  const allSymbols = await helpers.getAllSymbols()
  let notValid = false
  if (allSymbols) {
    symbols.forEach(symbol => {
      if (!allSymbols.includes(symbol)) notValid = true
    })
  }
  if (notValid) return res.status(400).send({ error: 'One or More symbol does not exist' })
  const tradesOn = getTradesOn()
  if (tradesOn.length > 0) return res.status(400).send({ error: 'You have trades on!' })
  if (!setAccountData(ACCOUNT_PROP.SYMBOLS, symbols)) return res.status(400).send({ error: 'Cannot remove updatesymbol' })
  const { resetListenersAndCandles } = await getExecuteState(account)
  resetListenersAndCandles()
  execute(account)
  return res.send(getAccountData())
})

accountRoutes.put('/:account/boton', async (req, res) => {
  const { account } = req.params
  const { getAccountData, turnBotOn } = await getAccountState(account)
  const { botOn } = req.body
  if (account !== ACCOUNTS_TYPE.PRIMARY && account !== ACCOUNTS_TYPE.SECONDARY) { return res.status(400).send({ error: 'Bad type' }) }
  if (typeof botOn !== 'boolean') return res.status(400).send({ error: 'Bad type' })
  const botOnNow = getAccountData('botOn')
  if (botOnNow === botOn) return res.status(400).send({ error: `botOn is already ${botOn}` })
  const data = await turnBotOn(botOn)
  console.log('bot its tooggled')
  const { resetListenersAndCandles } = await getExecuteState(account)
  if (botOn) execute(account)
  else resetListenersAndCandles()
  return res.send(data)
})
accountRoutes.put('/:account/limitLoss', async (req, res) => {
  const { account } = req.params
  const { getAccountData, setAccountData } = await getAccountState(account)
  const { limitLoss } = req.body
  if (account !== ACCOUNTS_TYPE.PRIMARY && account !== ACCOUNTS_TYPE.SECONDARY) { return res.status(400).send({ error: 'Bad type' }) }
  if (typeof limitLoss !== 'number') return res.status(400).send({ error: 'Bad type' })
  setAccountData(ACCOUNT_PROP.LIMIT_LOSS, limitLoss)
  console.log('change Limit')
  return res.send(getAccountData())
})

accountRoutes.put('/:account/leverage', async (req, res) => {
  const { account } = req.params
  const { leverage } = req.body
  const { getAccountData, setAccountData } = await getAccountState(account)
  if (account !== ACCOUNTS_TYPE.PRIMARY && account !== ACCOUNTS_TYPE.SECONDARY) { return res.status(400).send({ error: 'Bad type' }) }
  if (typeof leverage !== 'number') return res.status(400).send({ error: 'Bad type' })

  if (!setAccountData(ACCOUNT_PROP.LEVERAGE, leverage)) return res.status(400).send({ error: 'Problems with change leverage' })
  console.log('changed leverage')
  changeLeverage(account)
  return res.send(getAccountData())
})

accountRoutes.put('/:account/entryValue', async (req, res) => {
  const { account } = req.params
  const { entryValue } = req.body
  const { getAccountData, setAccountData } = await getAccountState(account)
  if (account !== ACCOUNTS_TYPE.PRIMARY && account !== ACCOUNTS_TYPE.SECONDARY) { return res.status(400).send({ error: 'Bad type' }) }
  if (typeof entryValue !== 'number') return res.status(400).send({ error: 'Bad type' })
  setAccountData(ACCOUNT_PROP.ENTRY_VALUE, entryValue)
  console.log('changed entryValue')
  return res.send(getAccountData())
})

accountRoutes.put('/:account/strategy', async (req, res) => {
  const { account } = req.params
  const { strategy } = req.body
  const { getAccountData, setAccountData } = await getAccountState(account)
  if (account !== ACCOUNTS_TYPE.PRIMARY && account !== ACCOUNTS_TYPE.SECONDARY) { return res.status(400).send({ error: 'Bad type' }) }
  if (strategy === STRATEGIES.HIDDEN_DIVERGENCE ||
    strategy === STRATEGIES.SHARK
  ) {
    const setStrategy = await setAccountData(ACCOUNT_PROP.STRATEGY, strategy)
    if (!setStrategy) return res.status(400).send({ error: 'During Trading, try later' })
    console.log('changed strategy')
  } else return res.status(400).send({ error: 'Bad request' })

  return res.send(getAccountData())
})

accountRoutes.put('/:account/onlyErrorMessages', async (req, res) => {
  const { account } = req.params
  const { onlyErrorMessages } = req.body
  const { getAccountData, setAccountData } = await getAccountState(account)
  if (account !== ACCOUNTS_TYPE.PRIMARY && account !== ACCOUNTS_TYPE.SECONDARY) { return res.status(400).send({ error: 'Bad type' }) }
  if (typeof onlyErrorMessages !== 'boolean') return res.status(400).send({ error: 'Bad type' })
  const oldOnlyErrorMessages = getAccountData(ACCOUNT_PROP.ONLY_ERROR_MSG)
  if (onlyErrorMessages === oldOnlyErrorMessages) return res.status(400).send({ error: `onlyErrorMessages is already ${onlyErrorMessages}` })
  setAccountData(ACCOUNT_PROP.ONLY_ERROR_MSG, onlyErrorMessages)
  return res.send(getAccountData())
})

module.exports = accountRoutes
