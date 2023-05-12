//* SUPER SUPER ADMIN CONTROLLER
const SuperAdminModel = require('../../src/model/superAdmin')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const {
  superAdminUpdateSchemaValidation,
  superAdminRegisterSchemaValidation,
  resetAndChangePasswordValidation,
  forgottenPassword,
} = require('../Validations/schema/superAdmin')
const bcrypt = require('bcrypt')
const { maxAge, createToken } = require('../jwt/superAdminToken')
const keys = require('../config/keys')
const sendEmail = require('./nodeMailer')
const crypto = require('crypto')

//* SUPER ADMIN END POINTS

//* GET ALL SUPER ADMINS
module.exports.getSuperAdminsOrSearchForSuperAdminsUsingEmail = async (
  req,
  res
) => {
  try {
    //* CREATE A QUERY OPTION
    const options = {
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 5,
    }

    //* SEARCH SUPER ADMIN USING QUERY SEARCH
    const search = req.query.search
    const query = search ? { email: { $regex: search, $options: 'i' } } : {} //* SEARCH SUPER ADMINS OR GET ALL SUPER ADMINS
    const result = await SuperAdminModel.paginate(query, options)

    //* IF RESULT HAS NEXT PAGE
    const nextPage = result.hasNextPage
      ? `${req.baseUrl}?page=${result.hasNextPage}`
      : null

    //* IF RESULT HAS PREV PAGE
    const prevPage = result.haPrevPage
      ? `${req.baseUrl}?page=${result.hasPrevPage}`
      : null

    //* SEND A SUCCESS RESPONSE TO THE CLIENT
    return res.status(200).json({
      status: 'success',
      result: result.docs,
      nextPage: nextPage,
      prevPage: prevPage,
    })
  } catch (err) {
    console.log({ error: err })
  }
}

//* GET SUPER ADMIN COUNTS
module.exports.get_SuperAdmins_Counts = async (req, res) => {
  try {
    //* GET COUNTS OF ALL SUPER ADMINS
    const count = await SuperAdminModel.countDocuments()

    //* IF NO SUPER ADMIN ....
    if (!count) {
      return res.status(404).json({ counts: 0 })
    } else {
      //* SEND THE SUPER ADMIN COUNTS TO THE CLIENT
      return res.status(200).json({ counts: count })
    }
  } catch (error) {
    console.log({ error: err })
  }
}

//* GET SUPER ADMIN BY ID
module.exports.get_SuperAdmins_By_Id = async (req, res) => {
  try {
    //* GETTING THE SUPER ADMIN ID IN THE PARAMS
    const { superAdminId } = req.params

    //* CHECKING IF ITS A VALID ID
    if (!mongoose.isValidObjectId(req.params.superAdminId))
      return res.status(404).json({ message: 'invalid superAdmin id' })

    //* GET THE SUPER ADMIN
    const superAdmin = await SuperAdminModel.findById(superAdminId)
      .select('-password -_id -createdAt -updatedAt -__v')
      .sort({ ' userDate': -1 })

    //* IF SUPER ADMIN DOES'NT EXISTS
    if (!superAdmin) {
      return res
        .status(404)
        .json({ message: 'no superAdmin with this id found' })
    } else {
      //* SEND THE SUPER ADMIN TO THE CLIENT
      return res.status(200).send(superAdmin)
    }
  } catch (error) {
    console.log({ error: err })
  }
}

//* GET ACTIVE SUPER ADMINS
module.exports.get_SuperAdmins_Active = async (req, res) => {
  //* GET ACTIVE SUPER ADMINS
  const active = await SuperAdminModel.find({ active: true })
    .select('fullName email country active -_id')
    .sort({
      createdAt: -1,
    })

  //* IF NOT ACTIVE SUPER ADMINS
  if (!active) return res.status(404).json('no active superAdmin')

  //*  SEND ALL ACTIVE SUPER ADMINS TO THE CLIENT
  res.status(200).send({ active_SuperAdmins: active })
}

//* GET NON ACTIVE SUPER ADMINS
module.exports.get_SuperAdmins_non_Active = async (req, res) => {
  //* GET OFFLINE SUPER ADMINS
  const active = await SuperAdminModel.find({ active: false })
    .select('fullName email country active -_id')
    .sort({
      createdAt: -1,
    })

  //* IF NO OFFLINE SUPER ADMINS

  if (!active) return res.status(404).json('no offline superAdmin')
  res.status(200).send({ offlineSuperAdmins: active })
}

//* REGISTER NEW SUPER ADMIN
module.exports.register_SuperAdmins = async (req, res) => {
  //* VALIDATING SUPER ADMIN SCHEMA
  const { error } = superAdminRegisterSchemaValidation(req.body)
  if (error) return res.status(422).send(error.details[0].message)

  try {
    //* GETTING THE DETAILS IN THE BODY
    const {
      fullName,
      email,
      password,
      mobile,
      country,
      zipCode,
      street,
      homeAddress,
      city,
    } = req.body

    //* CHECKING IF SUPER ADMIN EXISTS BEFORE REGISTRATION
    const AdminExist = await SuperAdminModel.findOne({ email })

    //* IF REGISTERED SUPER ADMIN FOUND
    if (AdminExist)
      return res
        .status(400)
        .json({ message: 'superAdmin already exists please login' })

    //* CHECKING IF IT'S A REGISTERED MOBILE NUMBER

    const findMobile = await SuperAdminModel.findOne({ mobile })

    //* IF MOBILE EXIST
    if (findMobile)
      return res.status(422).json({
        status: 'unprocessed entity',
        message: 'mobile already registered , please use a different one',
      })

    //* IF IT ISN'T A REGISTERED SUPER ADMIN ....
    const createAdmin = new SuperAdminModel({
      fullName,
      email,
      password,
      mobile,
      country,
      zipCode,
      street,
      homeAddress,
      city,
    })

    //* SAVE THE SUPER ADMIN
    await createAdmin.save()

    //* IF ERROR OCCURS DURING REGISTRATION
    if (!createAdmin) {
      return res.status(500).json({
        status: 'internet error',
        message: 'superAdmin is not registered',
      })
    } else {
      //* LOGIN SUPER ADMIN
      const token = createToken(createAdmin._id)
      res.cookie('superAdmin', token, {
        maxAge: maxAge * 1000,
        httpOnly: true,
      })

      //* SEND THE CREATED SUPER ADMIN TO THE CLIENT
      res.status(201).json({ status: 'registered ', createAdmin: createAdmin })
    }
  } catch (err) {
    console.log(err)
  }
}
//* LOGIN SUPER ADMIN
module.exports.login_SuperAdmin = async (req, res) => {
  //* GET THE DETAILS IN THE BODY
  const { email, password } = req.body

  try {
    //* FIND THE SUPER ADMIN WITH THE EMAIL PROVIDED IN THE BODY
    const superAdmin = await SuperAdminModel.findOne({ email })

    //* IF EMAIL ISN'T FOUND
    if (!superAdmin) return res.status(400).json({ message: 'email not found' })

    //* IF FOUND ... COMPARE PASSWORDS BEFORE LOGIN
    if (superAdmin && bcrypt.compareSync(password, superAdmin.password)) {
      //* IF PASSWORD CORRECT UPDATE THE ACTIVE STATUS
      await SuperAdminModel.findOneAndUpdate(
        { email },
        {
          active: true,
        },
        {
          new: true,
        }
      )

      //* CREATE A SIGN IN TOKEN
      const Token = jwt.sign(
        {
          superAdminId: superAdmin.id,
        },
        keys.SUPER_ADMIN_SECRET,
        {
          expiresIn: maxAge,
        }
      )

      //* STORE THE TOKEN IN A COOKIE
      res.cookie('superAdmin', Token, {
        maxAge: maxAge * 1000,
        httpOnly: true,
      })

      //* IF SUPER ADMINS CREDENTIALS ARE CORRECT HIS OR SHE IS SUPPOSED TO BE DIRECTED TO THE LOGIN PAGE
      return res.status(200).send({ loggedIn: superAdmin, tokenId: Token })
    } else {
      //* IF PASSWORD WRONG
      return res
        .status(404)
        .json({ status: 'bad request', message: 'incorrect password' })
    }
  } catch (err) {
    console.log({ error: err })
  }
}

//* LOG OUT SUPER ADMIN
module.exports.logOut_SuperAdmin = async (req, res) => {
  //* GETTING THE ID OF THE LOGGED IN SUPER ADMIN
  const loggedInSuperAdminId = req.superAdmin._id

  try {
    //* FIND THE SUPER ADMIN AND UPDATE THE ACTIVE STATUS
    const findSuperAdmin = await SuperAdminModel.findByIdAndUpdate(
      loggedInSuperAdminId,
      {
        active: false,
      },
      {
        new: true,
      }
    )

    //* REMOVE THE TOKEN FROM THE COOKIE
    res.cookie('superAdmin', '', {
      maxAge: 1,
      httpOnly: true,
    })

    //* SEND A SUCCESS RESPONSE TO THE CLIENT
    res.status(200).json({
      status: 'success',
      message: 'superAdmin logged out',
      active: findSuperAdmin.active,
    })
  } catch (error) {
    console.log({ error: err })
  }
}

//* UPDATE SUPER ADMIN BY ID
module.exports.update_SuperAdmins = async (req, res) => {
  //* VALIDATING THE DETAILS IN THE BODY
  const { error } = superAdminUpdateSchemaValidation(req.body)
  if (error) return res.status(422).send(error.details[0].message)

  try {
    //* GETTING THE SUPER ADMIN ID IN THE PARAMS
    const { superAdminId } = req.params

    //* CHECKING IF ITS A VALID ID
    if (!mongoose.isValidObjectId(req.params.superAdminId))
      return res.status(400).json({ message: 'invalid superAdmin id' })

    //* UPDATE THE SUPER ADMIN
    const updateSuperAdmin = await SuperAdminModel.findByIdAndUpdate(
      superAdminId,
      req.body,
      {
        new: true,
      }
    )

    //* IF SUPER ADMIN NOT UPDATED
    if (!updateSuperAdmin) {
      return res
        .status(500)
        .json({ status: 'internet error', message: 'superAdmin not updated' })
    } else {
      return res.status(200).json({ updated: updateSuperAdmin })
    }
  } catch (err) {
    console.log({ error: err })
  }
}

//* DELETE SUPER ADMIN
module.exports.delete_SuperAdmins = async (req, res) => {
  //* CHECKING IF IS A VALID ID
  if (!mongoose.isValidObjectId(req.params.superAdminId))
    return res.status(400).json({ message: 'invalid superAdmin id' })

  //* GETTING THE SUPER ADMIN ID IN THE PARAMS
  const { superAdminId } = req.params

  try {
    //* FIND SUPER ADMIN AND DELETE
    const superAdmin = await SuperAdminModel.findByIdAndDelete(superAdminId)

    //* IF SUPER ADMIN NOT DELETED .....
    if (!superAdmin) {
      return res.status(490).json({ message: 'superAdmin not deleted' })
    } else {
      //* SEND A SUCCESS RESPONSE TO THE CLIENT
      return res
        .status(200)
        .send({ success: true, message: 'superAdmin deleted' })
    }
  } catch (err) {
    console.log({ error: err })
  }
}

//* CHANGE PASSWORD
module.exports.changePassword = async (req, res) => {
  //* GETTING THE LOGGED IN SUPER ADMIN ID
  const loggedInSuperAdminId = req.superAdmin._id

  //* GETTING THE DETAILS IN THE BODY
  const { oldPassword, newPassword } = req.body

  //* FIND THE LOGGED IN SUPER ADMIN AND UPDATE
  const superAdmin = await SuperAdminModel.findByIdAndUpdate(
    loggedInSuperAdminId
  )

  //* COMPARE PASSWORD
  const isPasswordMatched = await superAdmin.comparePassword(oldPassword)

  //* IF INCORRECT OLD PASSWORD
  if (!isPasswordMatched) {
    return res
      .status(400)
      .json({ status: 'bad request', message: 'incorrect old password' })
  } else {
    //* RESET PASSWORD
    await superAdmin.createPasswordResetToken()
    superAdmin.password = newPassword
  }

  //* SAVE THE CHANGES
  await superAdmin.save()

  //* LOG THE SUPER ADMIN OUT
  res.cookie('superAdmin', '', { maxAge: 1, httpOnly: true })

  //* SEND A SUCCESS RESPONSE TO THE CLIENT
  return res.status(200).json({
    superAdmin: superAdmin.email,
    password: 'password updated please re-login',
  })
}

//* FORGOTTEN PASSWORD
module.exports.forgottenPassword = async (req, res) => {
  //* VALIDATING THE DETAILS IN THE BODY
  const { error } = forgottenPassword(req.body)
  if (error)
    return res.status(400).json({ message: ' please enter a valid email' })

  //* GET THE DETAILS IN THE BODY
  const { email } = req.body

  //* FIND THE SUPER ADMIN WITH THE PROVIDED EMAIL
  const superAdmin = await SuperAdminModel.findOne({ email })

  //* IF SUPER ADMIN WITH THAT EMAIL NOT FOUND
  if (!superAdmin) {
    return res.status(404).json({
      status: 'not found',
      message: ' no superAdmin which such email found',
    })
  } else {
    //* SEND A PASSWORD RESET TOKEN EMAIL TO THE PROVIDED EMAIL
    const resetToken = await superAdmin.createPasswordResetToken()

    //* SEND RESET URL
    const resetUrl = `hi , please link to link to reset your password , link is only valid for just 10min <a href = 'http://localhost:4000/api/eshop/superAdmin/resetToken/${resetToken}'>click here</a>`
    const data = {
      to: email,
      subject: 'password reset token',
      text: 'hello',
      htm: resetUrl,
    }

    //* SEND MAIL
    sendEmail(data)

    //* SEND A SUCCESS RESPONSE TO THE CLIENT
    return res
      .status(200)
      .json({ message: 'password reset link has been sent to your email' })
  }
}

//* RESET TOKEN
module.exports.resetToken = async (req, res) => {
  //* GETTING THE TOKEN ID IN THE PARAMS
  const { tokenId } = req.params

  //* VALIDATING THE DETAILS IN THE BODY
  const { error } = resetAndChangePasswordValidation(req.body)
  if (error)
    return res
      .status(422)
      .send({ status: 'unprocessed entity', error: error.details[0].message })

  //* GETTING THE DETAILS IN THE BODY
  const { newPassword } = req.body

  try {
    //* HASH THE PROVIDED TOKEN IN THE PARAMS
    const hashToken = crypto.createHash('sha256').update(tokenId).digest('hex')

    //* FIND THE SUPER ADMIN WITH THE HASHED TOKEN
    const superAdmin = await SuperAdminModel.findOne({
      passwordResetToken: hashToken,
      passwordResetExpiresAt: { $gt: Date.now() }, //* check expiration time
    })

    //* IF THE SUPER ADMIN'S EXPIRATION LIMIT IS REACHED
    if (!superAdmin) {
      return res.status(400).json({
        status: 'bad request',
        message: 'reset token expired , please try again later',
      })
    } else {
      //* RESET THE SUPER ADMIN PASSWORD
      superAdmin.password = newPassword
      superAdmin.passwordResetToken = undefined
      superAdmin.passwordResetExpiresAt = undefined

      //* SAVE THE SUPER ADMIN CHANGES
      await superAdmin.save()

      //* SEND A SUCCESS RESPONSE TO THE CLIENT
      return res
        .status(200)
        .json({ superAdmin: superAdmin.email, message: 'password updated ' })
    }
  } catch (error) {
    console.log(error)
  }
}

//* BLOCK SUPER ADMIN
module.exports.blockSuperAdmins = async (req, res) => {
  //* GETTING THE SUPER ADMIN ID IN THE PARAMS
  const { superAdminId } = req.params

  //* FIND THE SUPER ADMIN WITH THE ID AND BLOCK
  const findSuperAdmin = await SuperAdminModel.findByIdAndUpdate(
    superAdminId,
    {
      isBlocked: true,
    },
    {
      new: true,
    }
  )

  //* SEND A SUCCESS RESPONSE TO THE CLIENT
  res.status(200).json({
    status: 'success',
    message: 'superAdmin blocked',
    superAdmin: findSuperAdmin.email,
  })
}

//* UNBLOCK SUPER ADMIN
module.exports.unBlockSuperAdmin = async (req, res) => {
  //* GETTING THE SUPER ADMIN ID IN THE PARAMS
  const { superAdminId } = req.params

  //* FIND THE SUPER ADMIN WITH THE ID AND BLOCK
  const findSuperAdmin = await SuperAdminModel.findByIdAndUpdate(
    superAdminId,
    {
      isBlocked: false,
    },
    {
      new: true,
    }
  )

  //* SEND A SUCCESS RESPONSE TO THE CLIENT
  res.status(200).json({
    status: 'success',
    message: 'superAdmin unblocked',
    superAdmin: findSuperAdmin.email,
  })
}
