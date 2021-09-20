const { Telegraf } = require('telegraf')
const api = require('../services/api')
const { ACCOUNTS_TYPE } = require('../tools/constants')
const getAccountState = require('../states/account')
const telegramUserId = Number(process.env.TELEGRAM_USER_ID)
const priceFormat = new Intl.NumberFormat('en-us', { style: 'currency', currency: 'USD' })
const telegramToken = process.env.DEV_ENV === 'DEV' ? process.env.TELEGRAM_LOCAL_TOKEN : process.env.TELEGRAM_TOKEN

const bot = new Telegraf(telegramToken)

bot.hears('Saldo primary', async ctx => {
  if (ctx.from.id === telegramUserId) {
    const balance = await api.getBalance(ACCOUNTS_TYPE.PRIMARY)
    const newBalance = balance.filter((coin) => (coin.asset === 'USDT'))[0].availableBalance
    ctx.reply(`Saldo: ${priceFormat.format(newBalance)}`)
  }
})
bot.hears('Saldo secondary', async ctx => {
  if (ctx.from.id === telegramUserId) {
    const balance = await api.getBalance(ACCOUNTS_TYPE.SECONDARY)
    const newBalance = balance.filter((coin) => (coin.asset === 'USDT'))[0].availableBalance
    ctx.reply(`Saldo: ${priceFormat.format(newBalance)}`)
  }
})

async function sendMessage (account, message, isError, id = telegramUserId) {
  const { getAccountData } = await getAccountState(account)
  const onlyErrorMessages = getAccountData('onlyErrorMessages')
  if (onlyErrorMessages) {
    if (isError) bot.telegram.sendMessage(id, message)
  } else {
    bot.telegram.sendMessage(id, message)
  }
}

bot.launch()
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

module.exports = {
  bot,
  sendMessage
}
