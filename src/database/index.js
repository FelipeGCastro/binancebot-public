const mongoose = require('mongoose')

const mongoUser = process.env.DB_USER
const mongoSecret = process.env.DB_SECRET
const mongoURI = process.env.DEV_ENV === 'DEV'
  ? 'mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false'
  : `mongodb+srv://${mongoUser}:${mongoSecret}@luizbotapi.mzzrx.mongodb.net/luizbot?retryWrites=true&w=majority`

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
})
mongoose.Promise = global.Promise

module.exports = mongoose
