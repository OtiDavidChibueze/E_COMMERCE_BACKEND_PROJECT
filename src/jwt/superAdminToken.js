//* E-COMMERCE SUPER ADMIN TOKEN
const jwt = require('jsonwebtoken')
const keys = require('../config/keys')

//* CREATE USER TOKEN
const maxAge = 3 * 24 * 60 * 60
const createToken = (id) => {
  const secret = keys.SUPER_ADMIN_SECRET
  return jwt.sign({ id }, secret, {
    expiresIn: maxAge,
  })
}

module.exports = { maxAge, createToken }
