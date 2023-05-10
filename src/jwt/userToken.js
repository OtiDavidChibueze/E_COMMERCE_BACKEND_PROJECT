//* E-COMMERCE USER TOKEN
const jwt = require('jsonwebtoken')
const keys = require('../config/keys')

//* CREATE USER TOKEN
const maxAge = 1 * 24 * 60 * 60
const createToken = (id) => {
  return jwt.sign({ id }, keys.SECRET, {
    expiresIn: maxAge,
  })
}

module.exports = { maxAge, createToken }
