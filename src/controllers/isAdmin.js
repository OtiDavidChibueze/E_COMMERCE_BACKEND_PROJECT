//* IS ADMIN CONTROLLER
const IsAdminModel = require('../../src/model/isAdmin')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const {
  isAdminUpdateSchemaValidation,
  isAdminRegisterSchemaValidation,
  resetAndChangePasswordValidation,
  forgottenPassword,
} = require('../Validations/schema/isAdmin')
const bcrypt = require('bcrypt')
const { maxAge, createToken } = require('../jwt/isAdminToken')
const keys = require('../config/keys')
const sendEmail = require('./nodeMailer')
const crypto = require('crypto')

//* ADMIN END POINTS

//* GET ALL ADMINS
module.exports.getAdminsOrSearchForAdminsUsingEmail = async (req, res) => {
  try {
    //* CREATE A QUERY OPTION
    const options = {
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 5,
    }

    //* SEARCH ADMIN USING QUERY SEARCH
    const search = req.query.search
    const query = search ? { email: { $regex: search, $options: 'i' } } : {} //* SEARCH ADMINS OR GET ALL ADMINS
    const result = await IsAdminModel.paginate(query, options)

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

//* GET ADMIN COUNTS
module.exports.get_Admins_Counts = async (req, res) => {
  try {
    //* GET COUNTS OF ALL ADMINS
    const count = await IsAdminModel.countDocuments()

    //* IF NO ADMIN ....
    if (!count) {
      return res.status(404).json({ counts: 0 })
    } else {
      //* SEND THE ADMIN COUNTS TO THE CLIENT
      return res.status(200).json({ counts: count })
    }
  } catch (error) {
    console.log({ error: err })
  }
}

//* GET ADMIN BY ID
module.exports.get_Admins_By_Id = async (req, res) => {
  try {
    //* GETTING THE ADMIN ID IN THE PARAMS
    const { adminId } = req.params

    //* CHECKING IF ITS A VALID ID
    if (!mongoose.isValidObjectId(req.params.adminId))
      return res.status(404).json({ message: 'invalid admin id' })

    //* GET THE ADMIN
    const admin = await IsAdminModel.findById(adminId)
      .select('-password -_id -createdAt -updatedAt -__v')
      .sort({ ' userDate': -1 })

    //* IF ADMIN DOES'NT EXISTS
    if (!admin) {
      return res.status(404).json({ message: 'no admin with this id found' })
    } else {
      //* SEND THE ADMIN TO THE CLIENT
      return res.status(200).send(admin)
    }
  } catch (error) {
    console.log({ error: err })
  }
}

//* GET ACTIVE ADMINS
module.exports.get_Admins_Active = async (req, res) => {
  //* GET ACTIVE ADMINS
  const active = await IsAdminModel.find({ active: true })
    .select('fullName email country active -_id')
    .sort({
      createdAt: -1,
    })

  //* IF NOT ACTIVE ADMINS
  if (!active) return res.status(404).json('no active admin')

  //*  SEND ALL ACTIVE ADMINS TO THE CLIENT
  res.status(200).send({ active_Admins: active })
}

//* GET NON ACTIVE ADMINS
module.exports.get_Admins_non_Active = async (req, res) => {
  //* GET OFFLINE ADMINS
  const active = await IsAdminModel.find({ active: false })
    .select('fullName email country active -_id')
    .sort({
      createdAt: -1,
    })

  //* IF NO OFFLINE ADMINS

  if (!active) return res.status(404).json('no offline admin')
  res.status(200).send({ offlineAdmins: active })
}

//* REGISTER NEW ADMIN
module.exports.register_Admins = async (req, res) => {
  //* VALIDATING ADMIN SCHEMA
  const { error } = isAdminRegisterSchemaValidation(req.body)
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

    //* CHECKING IF ADMIN EXISTS BEFORE REGISTRATION
    const AdminExist = await IsAdminModel.findOne({ email })

    //* IF REGISTERED ADMIN FOUND
    if (AdminExist)
      return res
        .status(400)
        .json({ message: 'admin already exists please login' })

    //* CHECKING IF IT'S A REGISTERED MOBILE NUMBER

    const findMobile = await IsAdminModel.findOne({ mobile })

    //* IF MOBILE EXIST
    if (findMobile)
      return res.status(422).json({
        status: 'unprocessed entity',
        message: 'mobile already registered , please use a different one',
      })

    //* IF IT ISN'T A REGISTERED ADMIN ....
    const createAdmin = new IsAdminModel({
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

    //* SAVE THE ADMIN
    await createAdmin.save()

    //* IF ERROR OCCURS DURING REGISTRATION
    if (!createAdmin) {
      return res
        .status(500)
        .json({ status: 'internet error', message: 'admin is not registered' })
    } else {
      //* LOGIN ADMIN
      const token = createToken(createAdmin._id)
      res.cookie('admin', token, {
        maxAge: maxAge * 1000,
        httpOnly: true,
      })

      //* SEND THE CREATED ADMIN TO THE CLIENT
      res.status(201).json({ status: 'registered ', createAdmin: createAdmin })
    }
  } catch (err) {
    console.log(err)
  }
}
//* LOGIN ADMIN
module.exports.login_Admin = async (req, res) => {
  //* GET THE DETAILS IN THE BODY
  const { email, password } = req.body

  try {
    //* FIND THE ADMIN WITH THE EMAIL PROVIDED IN THE BODY
    const admin = await IsAdminModel.findOne({ email })

    //* IF EMAIL ISN'T FOUND
    if (!admin) return res.status(400).json({ message: 'email not found' })

    //* IF FOUND ... COMPARE PASSWORDS BEFORE LOGIN
    if (admin && bcrypt.compareSync(password, admin.password)) {
      //* IF PASSWORD CORRECT UPDATE THE ACTIVE STATUS
      await IsAdminModel.findOneAndUpdate(
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
          adminId: admin.id,
        },
        keys.ADMIN_SECRET,
        {
          expiresIn: maxAge,
        }
      )

      //* STORE THE TOKEN IN A COOKIE
      res.cookie('admin', Token, {
        maxAge: maxAge * 1000,
        httpOnly: true,
      })

      //* IF ADMINS CREDENTIALS ARE CORRECT HIS OR SHE IS SUPPOSED TO BE DIRECTED TO THE LOGIN PAGE
      return res.status(200).send({ loggedIn: admin, tokenId: Token })
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

//* LOG OUT ADMIN
module.exports.logOut_Admin = async (req, res) => {
  //* GETTING THE ID OF THE LOGGED IN ADMIN
  const loggedInAdminId = req.admin._id

  try {
    //* FIND THE ADMIN AND UPDATE THE ACTIVE STATUS
    const findAdmin = await IsAdminModel.findByIdAndUpdate(
      loggedInAdminId,
      {
        active: false,
      },
      {
        new: true,
      }
    )

    //* REMOVE THE TOKEN FROM THE COOKIE
    res.cookie('admin', '', {
      maxAge: 1,
      httpOnly: true,
    })

    //* SEND A SUCCESS RESPONSE TO THE CLIENT
    res.status(200).json({
      status: 'success',
      message: 'admin logged out',
      active: findAdmin.active,
    })
  } catch (error) {
    console.log({ error: err })
  }
}

//* UPDATE USER
module.exports.updateAdmin = async (req, res) => {
  //* GETTING THE LOGGED IN USER ID
  const { _id } = req.admin

  //* ACCESSING THE DETAILS IN THE BODY
  const { userName, mobile, country, homeAddress, street, zipCode, city } =
    req.body

  try {
    //* GET THE USER AND UPDATE....
    //! ONLY LOGGED IN USER CAN UPDATE THEIR SELF
    const admin = await IsAdminModel.findByIdAndUpdate(
      { _id },
      {
        fullName: userName,
        mobile: mobile,
        country: country,
        city: city,
        zipCode: zipCode,
        street: street,
        homeAddress: homeAddress,
      },
      { new: true }
    )

    //* IF ERROR OCCURS DURING THE UPDATE ...
    if (!admin)
      return res
        .status(500)
        .json({ status: 'internet error', message: 'not updated ' })

    //* SEND A SUCCESS RESPONSE TO THE CLIENT
    res.status(200).json({ updated: admin })
  } catch (error) {
    console.log({ error })
  }
}

//* UPDATE ADMIN BY ID
module.exports.update_Admins_By_Id = async (req, res) => {
  //* VALIDATING THE DETAILS IN THE BODY
  const { error } = isAdminUpdateSchemaValidation(req.body)
  if (error) return res.status(422).send(error.details[0].message)

  try {
    //* GETTING THE ADMIN ID IN THE PARAMS
    const { adminId } = req.params

    //* CHECKING IF ITS A VALID ID
    if (!mongoose.isValidObjectId(req.params.adminId))
      return res.status(400).json({ message: 'invalid admin id' })

    //* UPDATE THE ADMIN
    const updateAdmin = await IsAdminModel.findByIdAndUpdate(
      adminId,
      req.body,
      {
        new: true,
      }
    )

    //* IF ADMIN NOT UPDATED
    if (!updateAdmin) {
      return res
        .status(500)
        .json({ status: 'internet error', message: 'admin not updated' })
    } else {
      return res.status(200).json({ updated: updateAdmin })
    }
  } catch (err) {
    console.log({ error: err })
  }
}

//* DELETE ADMIN
module.exports.delete_Admin = async (req, res) => {
  //* CHECKING IF IS A VALID ID
  if (!mongoose.isValidObjectId(req.params.adminId))
    return res.status(400).json({ message: 'invalid admin id' })

  //* GETTING THE ADMIN ID IN THE PARAMS
  const { adminId } = req.params

  try {
    //* FIND ADMIN AND DELETE
    const admin = await IsAdminModel.findByIdAndDelete(adminId)

    //* IF ADMIN NOT DELETED .....
    if (!admin) {
      return res.status(490).json({ message: 'admin not deleted' })
    } else {
      //* SEND A SUCCESS RESPONSE TO THE CLIENT
      return res.status(200).send({ success: true, message: 'admin deleted' })
    }
  } catch (err) {
    console.log({ error: err })
  }
}

//* CHANGE PASSWORD
module.exports.changePassword = async (req, res) => {
  //* GETTING THE LOGGED IN ADMIN ID
  const loggedInAdminId = req.admin._id

  //* GETTING THE DETAILS IN THE BODY
  const { oldPassword, newPassword } = req.body

  //* FIND THE LOGGED IN ADMIN AND UPDATE
  const admin = await IsAdminModel.findByIdAndUpdate(loggedInAdminId)

  //* COMPARE PASSWORD
  const isPasswordMatched = await admin.comparePassword(oldPassword)

  //* IF INCORRECT OLD PASSWORD
  if (!isPasswordMatched) {
    return res
      .status(400)
      .json({ status: 'bad request', message: 'incorrect old password' })
  } else {
    //* RESET PASSWORD
    await admin.createPasswordResetToken()
    admin.password = newPassword
  }

  //* SAVE THE CHANGES
  await admin.save()

  //* LOG THE ADMIN OUT
  res.cookie('admin', '', { maxAge: 1, httpOnly: true })

  //* SEND A SUCCESS RESPONSE TO THE CLIENT
  return res
    .status(200)
    .json({ admin: admin.email, password: 'password updated please re-login' })
}

//* FORGOTTEN PASSWORD
module.exports.forgottenPassword = async (req, res) => {
  //* VALIDATING THE DETAILS IN THE BODY
  const { error } = forgottenPassword(req.body)
  if (error)
    return res.status(400).json({ message: ' please enter a valid email' })

  //* GET THE DETAILS IN THE BODY
  const { email } = req.body

  //* FIND THE ADMIN WITH THE PROVIDED EMAIL
  const admin = await IsAdminModel.findOne({ email })

  //* IF ADMIN WITH THAT EMAIL NOT FOUND
  if (!admin) {
    return res.status(404).json({
      status: 'not found',
      message: ' no admin which such email found',
    })
  } else {
    //* SEND A PASSWORD RESET TOKEN EMAIL TO THE PROVIDED EMAIL
    const resetToken = await admin.createPasswordResetToken()

    //* SEND RESET URL
    const resetUrl = `hi , please link to link to reset your password , link is only valid for just 10min <a href = 'http://localhost:4000/api/eshop/isAdmin/resetToken/${resetToken}'>click here</a>`
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

    //* FIND THE ADMIN WITH THE HASHED TOKEN
    const admin = await IsAdminModel.findOne({
      passwordResetToken: hashToken,
      passwordResetExpiresAt: { $gt: Date.now() }, //* check expiration time
    })

    //* IF THE ADMIN'S EXPIRATION LIMIT IS REACHED
    if (!admin) {
      return res.status(400).json({
        status: 'bad request',
        message: 'reset token expired , please try again later',
      })
    } else {
      //* RESET THE ADMIN PASSWORD
      admin.password = newPassword
      admin.passwordResetToken = undefined
      admin.passwordResetExpiresAt = undefined

      //* SAVE THE ADMIN CHANGES
      await admin.save()

      //* SEND A SUCCESS RESPONSE TO THE CLIENT
      return res
        .status(200)
        .json({ admin: admin.email, message: 'password updated ' })
    }
  } catch (error) {
    console.log(error)
  }
}

//* BLOCK ADMIN
module.exports.blockAdmin = async (req, res) => {
  //* GETTING THE ADMIN ID IN THE PARAMS
  const { adminId } = req.params

  //* FIND THE ADMIN WITH THE ID AND BLOCK
  const findAdmin = await IsAdminModel.findByIdAndUpdate(
    adminId,
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
    message: 'admin blocked',
    admin: findAdmin.email,
  })
}

//* UNBLOCK ADMIN
module.exports.unBlockAdmin = async (req, res) => {
  //* GETTING THE ADMIN ID IN THE PARAMS
  const { adminId } = req.params

  //* FIND THE ADMIN WITH THE ID AND BLOCK
  const findAdmin = await IsAdminModel.findByIdAndUpdate(
    adminId,
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
    message: 'admin unblocked',
    admin: findAdmin.email,
  })
}
