//* E-COMMERCE ADMIN TOKEN
const jwt = require('jsonwebtoken')
const keys = require('../config/keys')

//* CREATE USER TOKEN
const maxAge = 2 * 24 * 60 * 60
const createToken = (id) => {
  return jwt.sign({ id }, keys.ADMIN_SECRET, {
    expiresIn: maxAge,
  })
}

module.exports = { maxAge, createToken }
