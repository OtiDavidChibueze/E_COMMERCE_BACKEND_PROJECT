//* E-COMMERCE USER TOKEN
const jwt = require('jsonwebtoken')
const keys = require('../config/keys')

//* CREATE USER TOKEN
const maxAge = 1 * 24 * 60 * 60
const createToken = (id) => {
  const secret = keys.SECRET
  return jwt.sign({ id }, secret, {
    expiresIn: maxAge,
  })
}

module.exports = { maxAge, createToken }
