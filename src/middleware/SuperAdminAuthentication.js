//* SUPER_ADMIN TOKEN VERIFICATION AND HANDLING TOKEN ERRORS
const jwt = require('jsonwebtoken')
const keys = require('../config/keys')

const SuperAdminAuth = async (req, res, next) => {
  try {
    //* GETTING THE SUPER_ADMIN TOKEN FROM THE COOKIE
    const superAdminToken = req.cookies.superAdmin

    //*  GETTING THE ADMIN SECRET
    const secret = keys.SUPER_ADMIN_SECRET

    //* IF THE SUPER_ADMIN TOKEN ISN'T FOUND
    if (!superAdminToken) res.status(404).json({ error: 'no token provided' })

    //* IF FOUND
    if (superAdminToken) {
      jwt.verify(
        superAdminToken,
        secret,
        { algorithms: ['HS256'] },
        async (err, decodedToken) => {
          if (err) {
            console.log(err)
            //! HANDLING TOKEN ERRORS
            if (err.name === 'TokenExpiredError') {
              //! SUPER_ADMIN MUST BE REDIRECTED TO THE LOGIN PAGE
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

            //* ASSIGNING THE SUPER_ADMIN_ID IN THE DECODED_TOKEN TO THE REQ.SUPER_ADMIN
            req.superAdmin = { _id: decodedToken.superAdminId }
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

module.exports = { SuperAdminAuth }
