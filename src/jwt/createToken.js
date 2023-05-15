//* E-COMMERCE TOKEN
const jwt = require('jsonwebtoken')
const keys = require('../config/keys')

//* CREATE TOKEN
const maxAge = 3 * 24 * 60 * 60
const createToken = (id, role) => {
  return jwt.sign({ id, role }, keys.SECRET, {
    expiresIn: maxAge,
  })
}

module.exports = { maxAge, createToken }
