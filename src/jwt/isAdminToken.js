//* E-COMMERCE ADMIN TOKEN
const jwt = require('jsonwebtoken')
const keys = require('../config/keys')

//* CREATE USER TOKEN
const maxAge = 2 * 24 * 60 * 60
const createToken = (id) => {
  const secret = keys.ADMIN_SECRET
  return jwt.sign({ id }, secret, {
    expiresIn: maxAge,
  })
}

module.exports = { maxAge, createToken }
