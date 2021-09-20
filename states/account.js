const Account = require('../src/models/account')
const { updateAccountData } = require('../services/socket.js')
const { ACCOUNT_PROP, ACCOUNTS_TYPE } = require('../tools/constants')

const ACCOUNT = {
  [ACCOUNTS_TYPE.PRIMARY]: false,
  [ACCOUNTS_TYPE.SECONDARY]: false
}
async function getAccountState (account) {
  if (!ACCOUNT[account]) ACCOUNT[account] = await Account.findOne({ type: account })

  async function setAccountData (key, value) {
    ACCOUNT[account][key] = value
    const updated = await Account.findOneAndUpdate({ type: account }, { $set: { [key]: value } }, { new: true })
    return updated
  }

  function getAccountData (key = null) { return key ? ACCOUNT[account][key] : ACCOUNT[account] }

  function getTradesDelayed () {
    return new Promise(resolve => {
      setTimeout(() => resolve(ACCOUNT[account].tradesOn), 1000)
    })
  }

  async function setTradesOn (trade) {
    ACCOUNT[account].tradesOn.push(trade)
    await Account.findOneAndUpdate({ type: account }, { $set: { tradesOn: ACCOUNT[account].tradesOn } })
    updateAccountData(account, ACCOUNT[account])
  }

  async function clearTradesOn () {
    ACCOUNT[account].tradesOn = []
    await Account.findOneAndUpdate({ type: account }, { $set: { tradesOn: ACCOUNT[account].tradesOn } })
  }

  async function updateTradesOn (symbol, key, value) {
    const tradeIndex = ACCOUNT[account].tradesOn.findIndex(trade => trade.symbol === symbol)
    if (tradeIndex < 0) return
    ACCOUNT[account].tradesOn[tradeIndex][key] = value
    await Account.findOneAndUpdate({ type: account }, { $set: { tradesOn: ACCOUNT[account].tradesOn } })
  }

  async function removeFromTradesOn (symb) {
    ACCOUNT[account].tradesOn = ACCOUNT[account].tradesOn.filter(trade => trade.symbol !== symb)
    await Account.findOneAndUpdate({ type: account }, { $set: { tradesOn: ACCOUNT[account].tradesOn } })
    updateAccountData(account, ACCOUNT[account])
  }

  async function updateListenKeyIsOn (value) {
    ACCOUNT[account].listenKeyIsOn = value
    await Account.findOneAndUpdate({ type: account }, { $set: { listenKeyIsOn: value } })
    updateAccountData(account, ACCOUNT[account])
  }

  function getTradesOn () { return ACCOUNT[account].tradesOn }

  async function turnBotOn (bool) {
    if (bool) {
      console.log('ACCOUNT[account].botOn', ACCOUNT[account].botOn)
      if (!ACCOUNT[account].botOn) {
        clearTradesOn()
        return await setAccountData(ACCOUNT_PROP.BOT_ON, bool)
      }
    } else {
      clearTradesOn()
      updateListenKeyIsOn(false)
      await setAccountData(ACCOUNT_PROP.LIMIT_REACHED, false)
      return await setAccountData(ACCOUNT_PROP.BOT_ON, bool)
    }
  }

  return {
    getTradesOn,
    setTradesOn,
    setAccountData,
    getAccountData,
    getTradesDelayed,
    updateTradesOn,
    removeFromTradesOn,
    updateListenKeyIsOn,
    turnBotOn
  }
}

module.exports = getAccountState
