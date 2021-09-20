const getAccountState = require('./account')
const hiddenDivergence = require('../strategies/hiddenDivergence')
const sharkStrategy = require('../strategies/shark')
const { STRATEGIES, ACCOUNTS_TYPE, ACCOUNT_PROP } = require('../tools/constants')

const state = {
  [ACCOUNTS_TYPE.PRIMARY]: {
    candlesListeners: [],
    userDataListeners: null,
    validateEntry: () => {},
    getStopAndTargetPrice: () => {},
    interval: null,
    allCandles: []
  },
  [ACCOUNTS_TYPE.SECONDARY]: {
    candlesListeners: [],
    userDataListeners: null,
    validateEntry: () => {},
    getStopAndTargetPrice: () => {},
    interval: null,
    allCandles: []
  }
}

async function getExecuteState (account) {
  try {
    const { getAccountData } = await getAccountState(account)
    const strategy = getAccountData(ACCOUNT_PROP.STRATEGY)
    const SET_STRATEGY = {
      [STRATEGIES.SHARK]: sharkStrategy,
      [STRATEGIES.HIDDEN_DIVERGENCE]: hiddenDivergence
    }

    state[account].validateEntry = SET_STRATEGY[strategy].validateEntry
    state[account].getStopAndTargetPrice = SET_STRATEGY[strategy].getStopAndTargetPrice
    state[account].interval = SET_STRATEGY[strategy].getInterval()

    function setState (key, values) { state[account][key] = values }
    function getState (key) { return key ? state[account][key] : state[account] }
    function addToStateArray (key, value) {
      state[account][key].push(value)
    }
    function updateAllCandles (arrayWithValues) { state[account].allCandles = arrayWithValues }
    function resetListenersAndCandles () {
      state[account].candlesListeners.forEach(list => { list.listener.close(1000) })
      if (state[account].userDataListeners) state[account].userDataListeners.close(1000)
      state[account].candlesListeners = []
      state[account].allCandles = []
    }
    return { updateAllCandles, setState, getState, addToStateArray, resetListenersAndCandles }
  } catch (error) {
    console.log(error)
  }
}

module.exports = getExecuteState
