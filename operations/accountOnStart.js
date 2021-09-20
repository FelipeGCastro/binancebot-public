const api = require('../services/api.js')
const getAccountState = require('../states/account')
const Account = require('../src/models/account')
const { ACCOUNT_PROP } = require('../tools/constants.js')

async function checkAccountOnStart (account, execute) {
  const { updateListenKeyIsOn, setAccountData, removeFromTradesOn } = await getAccountState(account)
  const accountData = await Account.findOne({ type: account })
  if (accountData.limitReached) setAccountData(ACCOUNT_PROP.LIMIT_REACHED, false)
  if (accountData.listenKeyIsOn) updateListenKeyIsOn(false)
  if (accountData.tradesOn.length > 0) {
    const accountInfo = await api.getAccountInfo(account)
    accountData.tradesOn.forEach(trade => {
      const hasTrade = accountInfo.positions.find(pos => pos.symbol === trade.symbol)
      if (!hasTrade) removeFromTradesOn(trade.symbol)
    })
  }
  if (accountData.botOn) execute(account)
}

module.exports = checkAccountOnStart
