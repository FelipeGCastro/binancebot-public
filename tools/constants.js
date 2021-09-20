
const ACCOUNTS_TYPE = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary'
}
const STRATEGIES = {
  SHARK: 'sharkStrategy',
  HIDDEN_DIVERGENCE: 'hiddenDivergence'
}

const ACCOUNT_PROP = {
  STRATEGY: 'strategy',
  SYMBOLS: 'symbols',
  BOT_ON: 'botOn',
  LEVERAGE: 'leverage',
  ENTRY_VALUE: 'entryValue',
  MAX_ENTRY_VALUE: 'maxEntryValue',
  LIMIT_ORDERS: 'limitOrdersSameTime',
  LIMIT_REACHED: 'limitReached',
  LISTEN_KEY_IS_ON: 'listenKeyIsOn',
  TRADES_ON: 'tradesOn',
  LIMIT_LOSS: 'limitLoss',
  ONLY_ERROR_MSG: 'onlyErrorMessages'
}

const TRADES_ON = {
  STOP_PRICE: 'stopMarketPrice',
  PROFIT_PRICE: 'takeProfitPrice',
  ENTRY_PRICE: 'entryPrice',
  SYMBOL: 'symbol',
  BREAKEVEN_PRICE: 'breakevenTriggerPrice',
  RISE_STOP_PRICE: 'riseStopTriggerPrice',
  BREAKEVEN_CREATED: 'breakevenCreated',
  RISE_STOP_CREATED: 'riseStopCreated',
  STOP_CREATED: 'stopOrderCreated',
  PROFIT_CREATED: 'profitOrderCreated',
  SIDE: 'side',
  STRATEGY: 'strategy',
  TRADE_ID: 'tradeId',
  STOP_LOSS_ID: 'stopLossId',
  TAKE_PROFIT_ID: 'takeProfitId',
  BREAKEVEN_ID: 'breakevenId',
  RISE_STOP_ID: 'riseStopId',
  QUANTITY: 'quantity'
}

const ORDER_TYPE = {
  LIMIT: 'LIMIT',
  MARKET: 'MARKET',
  STOP: 'STOP',
  STOP_MARKET: 'STOP_MARKET',
  TAKE_PROFIT: 'TAKE_PROFIT',
  TAKE_PROFIT_MARKET: 'TAKE_PROFIT_MARKET',
  TRAILING_STOP_MARKET: 'TRAILING_STOP_MARKET'
}

const INDICATORS_OBJ = {
  RSI: 'rsi',
  EMA: 'ema',
  STOCH: 'stoch',
  TIME: 'time'
}

const SIDE = {
  BUY: 'BUY',
  SELL: 'SELL'
}
const POSITION_SIDE = {
  SHORT: 'SHORT',
  LONG: 'LONG',
  BOTH: 'BOTH'
}

const CANDLE = {
  OPEN_TIME: 0,
  OPEN: 1,
  HIGH: 2,
  LOW: 3,
  CLOSE: 4,
  VOLUME: 5,
  CLOSE_TIME: 6
}

module.exports = {
  STRATEGIES,
  CANDLE,
  ORDER_TYPE,
  SIDE,
  POSITION_SIDE,
  INDICATORS_OBJ,
  ACCOUNTS_TYPE,
  TRADES_ON,
  ACCOUNT_PROP
}
