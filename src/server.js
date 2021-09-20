const express = require('express')
const socketio = require('socket.io')
const auth = require('./controllers/authControllers')
const account = require('./controllers/accountControler')
const tradeRoutes = require('./controllers/tradeController')
const authMiddleware = require('./middlewares/auth')
const http = require('http')

const app = express()
const httpServer = http.createServer(app)
const io = new socketio.Server(httpServer)

app.use(express.json())

app.use('/user', auth).use(authMiddleware)
app.use('/account', account).use(authMiddleware)
app.use('/trade', tradeRoutes).use(authMiddleware)

io.on('connection', (socket) => {
  console.log('New Conection:', socket.id)
  socket.emit()
  require('../services/socket').setIo(io)
})

httpServer.listen(process.env.PORT || 3333, () => console.log('Server is running'))
