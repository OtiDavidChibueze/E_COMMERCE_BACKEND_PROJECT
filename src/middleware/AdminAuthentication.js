//* ADMIN TOKEN VERIFICATION AND HANDLING TOKEN ERRORS
const jwt = require('jsonwebtoken')
const keys = require('../config/keys')

const AdminAuthToken = async (req, res, next) => {
  try {
    //* GETTING THE ADMIN TOKEN FROM THE COOKIE
    const adminToken = req.cookies.admin

    //*  GETTING THE ADMIN SECRET
    const secret = keys.ADMIN_SECRET

    //* IF THE ADMIN TOKEN ISN'T FOUND
    if (!adminToken) res.status(404).json({ error: 'no token provided' })

    //* IF FOUND
    if (adminToken) {
      jwt.verify(
        adminToken,
        secret,
        { algorithms: ['HS256'] },
        async (err, decodedToken) => {
          if (err) {
            console.log(err)
            //* HANDLING TOKEN ERRORS
            if (err.name === 'TokenExpiredError') {
              //! ADMIN MUST BE REDIRECTED TO THE LOGIN PAGE
              res
                .status(301)
                .json({ message: 'token expired , please re-login' })
            } else {
              //! TOKEN HAS BEEN TEMPERED WITH
              res.status(404).json({ error: 'invalid token' })
            }
          } else {
            //* GET THE DECODED TOKEN
            console.log(decodedToken)

            //* ASSIGNING THE ADMIN_ID IN THE DECODED_TOKEN TO THE REQ.ADMIN
            req.admin = { _id: decodedToken.adminId }
            next()
          }
        }
      )
    }
  } catch (error) {
    console.log(error)
    res.status(400).json({ error: err.message })
  }
}

module.exports = { AdminAuthToken }