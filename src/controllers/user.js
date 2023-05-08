//* USER CONTROLLER
const UserModel = require('../model/user')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const {
  userRegisterSchemaValidation,
  userUpdateSchemaValidation,
  resetAndChangePasswordValidation,
} = require('../Validations/schema/user')
const { maxAge, createToken } = require('../jwt/userToken')
const crypto = require('crypto')
const sendEmail = require('./nodeMailer')

//*  USER END POINTS

//* GET ALL USERS
module.exports.get_users = async (req, res) => {
  try {
    //* QUERY OPTIONS
    const options = {
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 5,
    }

    //*  LOOK FOR USERS USING THEIR EMAIL OR GET ALL USERS
    const search = req.query.search
    const query = search ? { email: { $regex: search, $options: 'i' } } : {} //* SEARCH OR GET ALL USERS
    const result = await UserModel.paginate(query, options)

    //* IF RESULT HAS NEXT PAGE
    const nextPage = result.hasNextPage
      ? `${req.baseUrl}?page=${result.nextPage}`
      : null

    //* IF RESULT HAS PREV PAGE

    const prevPage = result.hasPrevPage
      ? `${req.baseUrl}?page=${result.prevPage}`
      : null

    //* SEND A SUCCESS RESPONSE TO THE CLIENT
    return res
      .status(200)
      .json({ result: result.docs, nextPage: nextPage, prevPage: prevPage })
  } catch (error) {
    return res.status(500).json({ message: 'internet error' })
  }
}

//* GET USER BY ID
module.exports.get_users_by_id = async (req, res) => {
  try {
    //* CHECKING IF ITS A VALID USER ID
    if (!mongoose.isValidObjectId(req.params.userId))
      return res.status(400).json({ error: 'invalid user id' })

    //* GETTING THE USER
    const getUser = await UserModel.findById(userId).select(
      '-password -_id -createdAt -updatedAt -__v'
    )

    //* IF USER ISN'T FOUND
    if (!getUser) {
      return res.status(404).json({ message: 'user not found' })
    } else {
      return res.status(200).json({ user: getUser })
    }
  } catch (err) {
    res.status(400).json({ status: 'bad request', error: err })
  }
}

//* GET USER COUNTS
module.exports.get_users_counts = async (req, res) => {
  try {
    //* GET COUNTS
    const counts = await UserModel.countDocuments()

    //* IF NOT REGISTERED USER
    if (!counts) return res.status(404).json({ counts: 0 })

    //* SEND THE COUNTS OF ALL REGISTERED USER
    res.status(200).json({ counts: counts })
  } catch (err) {
    res.status(400).json({ status: 'bad request', error: err })
  }
}

//* REGISTER USER
module.exports.post_register = async (req, res) => {
  //* VALIDATING USER REGISTER SCHEMA
  const { error } = userRegisterSchemaValidation(req.body)
  if (error) return res.status(422).json(error.details[0].message)

  try {
    //* ACCESSING THE DETAILS IN THE BODY
    const { email, userName, password, mobile, country } = req.body

    //* CHECKING IF THE MOBILE NUMBER IS ALREADY EXISTS
    const mobileExists = await UserModel.findOne({ mobile })

    //* IF MOBILE EXISTS
    if (mobileExists)
      return res.status(400).json({ message: 'mobile number already taken' })

    //* CHECKING IF THE USER EXIST BEFORE REGISTRATION
    const newUserExist = await UserModel.findOne({ email })

    //* IF YOUR EXISTS
    if (newUserExist)
      return res
        .status(406)
        .json({ message: 'not accepted , user already exist' })

    //* IF USER DOESN'T EXITS REGISTER A USER
    const newUser = new UserModel({
      email,
      mobile,
      userName,
      password,
      country,
    })

    //* SAVE THE USER IN THE DB
    await newUser.save()

    //* IF ERROR OCCURS DURING REGISTRATION
    if (!newUser) {
      return res.status(500).json({
        success: false,
        status: 'internet error',
        message: 'user not created',
      })
    } else {
      //* SENDING THE USERS TOKEN IN A COOKIE AND A EXPIRATION DATE
      const token = createToken(newUser._id)
      res.cookie('User', token, { maxAge: maxAge * 1000, httpOnly: true })
      //* SEND A SUCCESS RESPONSE TO THE CLIENT AND THE USER IS LOGGED IN IMMEDIATELY
      return res.status(201).json({ registered: newUser })
    }
  } catch (error) {
    console.log(error)
  }
}

//* UPDATE USER BY ID
module.exports.put = async (req, res) => {
  try {
    //* VALIDATING SCHEMA
    const { error } = userUpdateSchemaValidation(req.body)
    if (error) return res.status(422).send(error.details[0].message)

    //* CHECKING IF THE USER ID IS VALID
    if (!mongoose.isValidObjectId(req.params.userId))
      return res.status(400).json({ error: 'invalid user id' })

    //* UPDATE THE USER
    const updateUser = await UserModel.findByIdAndUpdate(userId, req.body, {
      new: true,
    })

    //* IF ERROR OCCURS DURING UPDATE
    if (!updateUser) {
      return res.status(500).json({
        success: false,
        status: 'internet error',
        message: 'user not updated',
      })
    } else {
      //* SENDING THE UPDATED USER TO THE CLIENT
      return res.status(200).send({ updated: updateUser })
    }
  } catch (err) {
    res.status(400).json({ status: 'bad request', error: err })
  }
}

//* LOGIN USER
module.exports.post_login = async (req, res) => {
  //* GETTING THE DETAILS IN THE BODY
  const { email, password } = req.body

  try {
    //* CHECKING IF THE EMAIL IS REGISTERED
    const user = await UserModel.findOne({ email })

    //* IF IT ISN'T REGISTERED
    if (!user) return res.status(400).json({ message: 'email not found' })

    //* IF REGISTERED THEN .... COMPARE THE PASSWORDS
    if (user && bcrypt.compareSync(password, user.password)) {
      //* CREATE A LOGIN TOKEN FOR THE USER
      const secret = process.env.SECRET
      const Token = jwt.sign(
        {
          userId: user.id,
        },
        secret,
        {
          expiresIn: maxAge,
        }
      )
      //* STORE THE TOKEN IN A COOKIE
      res.cookie('User', Token, {
        maxAge: maxAge * 1000,
        httpOnly: true,
      })

      //* SEND A SUCCESS RESPONSE TO THE CLIENT
      res.status(200).json({ logged_in: user })
    } else {
      //* SEND INCORRECT PASSWORD TO THE CLIENT
      res.status(406).json({
        status: 'unaccepted',
        message: 'incorrect password please check your password and try again',
      })
    }
  } catch (error) {
    res.status(400).json({ status: 'bad request', error: error })
  }
}

//* LOG OUT USER
module.exports.post_logOut = (req, res) => {
  try {
    //* REMOVE THE TOKEN FROM THE COOKIE
    res.cookie('User', '', { maxAge: 1, httpOnly: true })

    //* SEND A SUCCESS RESPONSE TO THE CLIENT
    res.status(200).json({ success: true, message: 'logged out user' })
  } catch (error) {
    res.status(500).json({ status: 'internet error', error: error })
  }
}

//* BLOCK A USER
module.exports.blockUserById = async (req, res) => {
  //* GETTING THE USER ID IN THE PARAMS
  const { userId } = req.params

  try {
    //* CHECKING IF ID IS VALID
    if (!mongoose.isValidObjectId(req.params.userId))
      return res
        .status(404)
        .json({ status: 'not found', message: 'no user with such id found' })

    //* IF USER WITH ID EXISTS ....
    const blockUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        isBlocked: true,
      },
      {
        new: true,
      }
    )

    //* IF ERROR OCCURS DURING THE PROCESS
    if (!blockUser)
      return res
        .status(500)
        .json({ status: 'internet error', error: 'user not blocked' })

    //* SEND A SUCCESS RESPONSE TO THE CLIENT
    res.status(201).json({ status: 'success', message: 'user blocked' })
  } catch (err) {
    res.status(400).json({ error: err })
  }
}

module.exports.unBlockUserById = async (req, res) => {
  //* GETTING THE USER ID THE PARAMS
  const { userId } = req.params

  try {
    //* CHECKING IF ID IS VALID
    if (!mongoose.isValidObjectId(req.params.userId))
      return res.status(404).json({
        status: 'not found',
        message: 'no such user with that id  found',
      })

    //* IF USER WITH SUCH ID EXIST .....
    const blockUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        isBlocked: false,
      },
      {
        new: true,
      }
    )

    //* IF OCCUR OCCURS DURING PROCESS ....
    if (!blockUser)
      return res
        .status(500)
        .json({ status: 'internet error', error: 'user not unblocked' })

    res.status(200).json({ status: 'success', message: 'user unblocked' })
  } catch (err) {
    res.status(400).json({ status: ' bad request', error: err })
  }
}

//* CHANGE USER PASSWORD
module.exports.changeUserPassword = async (req, res) => {
  //* GETTING THE DETAILS IN THE BODY
  const { oldPassword, newPassword } = req.body

  //* VALIDATING THE USERS DETAILS IN THE BODY
  const { error } = resetAndChangePasswordValidation(req.body)

  //* IF ERROR OCCURS
  if (error)
    return res
      .status(422)
      .json({ status: 'unprocessed entity', error: error.details[0].message })

  //* ONLY LOGGED IN USERS CAN CHANGE PASSWORD
  const loggedInUserId = req.user._id

  try {
    //* GETTING THE LOGGED IN USER
    const user = await UserModel.findById(loggedInUserId)

    //* COMPARE OLD PASSWORD BEFORE CHANGING
    const oldPasswordIsMatched = await user.comparePassword(oldPassword)

    //*  IF OLD PASSWORD ISN'T CORRECT
    if (!oldPasswordIsMatched) {
      return res.status(400).json({ Message: 'incorrect old password' })
    } else {
      //* IF CORRECT OLD PASSWORD THEN PROCEED....
      await user.createPasswordResetToken()
      user.password = newPassword
    }

    //* SAVE THE USER CHANGES
    await user.save()

    //* SEND A SUCCESS RESPONSE TO THE CLINT
    return res
      .status(200)
      .json({ user: user.email, message: 'password updated' })
  } catch (error) {
    console.log(error)
  }
}

//* FORGOTTEN PASSWORD
module.exports.forgottenPassword = async (req, res) => {
  //* GETTING THE DETAILS IN THE BODY
  const { email } = req.body

  try {
    //* GETTING THE USER WITH THE PROVIDED EMAIL
    const user = await UserModel.findOne({ email })

    //* IF USER ISN'T FOUND
    if (!user) {
      return res.status(404).json({ message: 'no user with this email found' })
    } else {
      //* SEND A RESET EMAIL LINK TO THE USER AND RESET USER PASSWORD
      const resetToken = await user.createPasswordResetToken()

      //* SEND A RESET LINK
      const resetUrl = `Hi , please link the link to reset your password , link is only valid for 10min <a href = 'http://localhost:4000/api/eshop/user/resetToken/${resetToken}'>click here</a>`

      //* EMAIL DATA
      const data = {
        to: email,
        subject: 'password reset link',
        text: 'hello',
        htm: resetUrl,
      }

      //* SEND THE EMAIL
      sendEmail(data)

      //* SEND A PASSWORD RESET EMAIL TO THE CLIENT
      return res
        .status(200)
        .json({ message: 'a password reset link has been sent to ur email' })
    }
  } catch (error) {
    console.log(error)
  }
}

//* RESET TOKEN
module.exports.resetToken = async (req, res) => {
  //* GETTING THE TOKEN IN THE PARAMS
  const { token } = req.params

  //* GETTING THE DETAILS IN THE BODY
  const { newPassword } = req.body

  //* VALIDATING THE DETAILS IN THE BODY
  const { error } = resetAndChangePasswordValidation(req.body)
  if (error)
    return res
      .status(422)
      .send({ status: 'unprocessed entity', error: error.details[0].message })

  try {
    //* HASH THE PROVIDED TOKEN IN THE PARAMS
    const hashToken = crypto.createHash('sha256').update(token).digest('hex')

    //* FIND THE USER WITH THE HASHED TOKEN
    const user = await UserModel.findOne({
      passwordResetToken: hashToken,
      passwordResetExpiresAt: { $gt: Date.now() }, //* check expiration time
    })

    //* IF THE USER'S EXPIRATION LIMIT IS REACHED
    if (!user) {
      return res.status(400).json({
        status: 'bad request',
        message: 'reset token expired , please try again later',
      })
    } else {
      //* RESET THE USER PASSWORD
      user.password = newPassword
      user.passwordResetToken = undefined
      user.passwordResetExpiresAt = undefined

      //* SAVE THE USER CHANGES
      await user.save()

      //* SEND A SUCCESS RESPONSE TO THE CLIENT
      return res
        .status(200)
        .json({ user: user.email, message: 'password updated ' })
    }
  } catch (error) {
    console.log(error)
  }
}

//* DELETE USER BY ID
module.exports.delete_user = async (req, res) => {
  try {
    //* GETTING THE USER ID IN THE PARAMS
    const { userId } = req.params

    //* CHECKING IF ITS A VALID USER ID
    if (!mongoose.isValidObjectId(req.params.userId))
      return res.status(400).json({ error: 'invalid user id' })

    //* FIND THE USER AND DELETE
    const delUser = await UserModel.findByIdAndDelete(userId)

    //* IF USER  ISN'T DELETED
    if (!delUser) {
      return res
        .status(500)
        .json({ status: 'internet error', message: 'user not deleted' })
    } else {
      //* SEND A SUCCESS RESPONSE TO THE CLIENT
      return res
        .status(200)
        .send({ success: true, message: 'user deleted successful' })
    }
  } catch (error) {
    console.log(error)
  }
}
