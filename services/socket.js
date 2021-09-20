const { ACCOUNTS_TYPE } = require('../tools/constants')

// define module constructor that accepts the io variable
let io
module.exports = {
  updateAccountData,
  setIo: function (importIO) {
    io = importIO
  }
}

// elsewhere in the module
function updateAccountData (account, data) {
  if (account !== ACCOUNTS_TYPE.PRIMARY &&
    account !== ACCOUNTS_TYPE.SECONDARY) return false
  const interv = setInterval(() => {
    if (io) {
      io.emit(`${account}Account`, data)
      clearInterval(interv)
    }
  }, 5000)
}
