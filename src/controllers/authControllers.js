const express = require('express')
const User = require('../models/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const authConfig = require('../config/auth')

const userRoutes = express.Router()

function generateToken (params = {}) {
  return jwt.sign(params, authConfig.secret)
}

userRoutes.post('/register', async (req, res) => {
  const { email } = req.body
  try {
    if (await User.findOne({ email })) { return res.status(400).send({ error: 'User already exists' }) }
    const user = await User.create(req.body)
    user.password = undefined
    return res.send({
      user,
      token: generateToken({ id: user.id })
    })
  } catch (error) {
    return res.status(400).send({ error: 'Registration failed', data: error })
  }
})

userRoutes.post('/authenticate', async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email }).select('+password')

  if (!user) { return res.status(400).send({ error: 'User does not exists' }) }
  if (!await bcrypt.compare(password, user.password)) {
    return res.status(400).send({ error: 'Invalid Password' })
  }
  user.password = undefined

  res.send({
    user,
    token: generateToken({ id: user.id })
  })
})

module.exports = userRoutes
