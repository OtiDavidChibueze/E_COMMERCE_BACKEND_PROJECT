//* ADMIN TOKEN VERIFICATION AND HANDLING TOKEN ERRORS
const jwt = require('jsonwebtoken')
const keys = require('../config/keys')

const authorization = async (req, res, next) => {
  try {
    //* GETTING THE USER TOKEN FROM THE COOKIE
    const userToken = req.cookies.user

    //* IF THE USER TOKEN ISN'T FOUND
    if (!userToken) res.status(404).json({ error: 'no token provided' })

    //* IF FOUND
    if (userToken) {
      jwt.verify(
        userToken,
        keys.SECRET,
        { algorithms: ['HS256'] },
        async (err, decodedToken) => {
          if (err) {
            console.log(err)
            //! HANDLING TOKEN ERRORS
            if (err.name === 'TokenExpiredError') {
              //! USER MUST BE REDIRECTED TO THE LOGIN PAGE
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

            //* ASSIGNING THE USER_ID IN THE DECODED_TOKEN TO THE REQ.USER
            req.user = { _id: decodedToken.userId, role: decodedToken.role }

            if (req.user.role === 'user') {
              next()
            } else if (req.user.role === 'admin') {
              next()
            } else if (req.user.role === 'superAdmin') {
              next()
            } else {
              res.status(401).json({ message: 'unauthorized' })
            }
          }
        }
      )
    }
  } catch (error) {
    console.log(error)
    res.status(400).json({ error: err.message })
  }
}

module.exports = { authorization }
