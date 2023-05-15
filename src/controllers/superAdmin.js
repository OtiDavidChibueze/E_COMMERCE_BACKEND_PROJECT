//* SUPER ADMIN CONTROLLER
const SuperAdminModel = require('../model/superAdmin')
const ProductModel = require('../model/product')
const CartModel = require('../model/cart')

const jwt = require('jsonwebtoken')
const { maxAge, createToken } = require('../jwt/createToken')

const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const uniqid = require('uniqid')

const {
  superAdminRegisterSchemaValidation,
  superAdminUpdateSchemaValidation,
  resetAndChangePasswordValidation,
  forgottenPassword,
} = require('../Validations/schema/superAdmin')

const keys = require('../config/keys')
const sendEmail = require('./nodeMailer')
const CouponModel = require('../model/coupon')
const OrderModel = require('../model/order')

//*  SUPER ADMIN END POINTS

//* GET ALL SUPER ADMINS
module.exports.get_All_SuperAdmins_And_Also_Search_SuperAdmins_With_Emails =
  async (req, res) => {
    //* ONLY ADMINS CAN GET ALL SUPER ADMINS
    if (req?.superAdmin?.role !== 'superAdmin')
      return res.status(401).json({ message: 'unauthorized' })

    try {
      //* QUERY OPTIONS
      const options = {
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 5,
        select: '-password',
        populate: {
          path: 'wishList',
          select: 'title price -_id countInStock',
        },
      }

      //*  LOOK FOR SUPER ADMINS USING THEIR EMAIL OR GET ALL SUPER ADMINS
      const search = req.query.search
      const query = search ? { email: { $regex: search, $options: 'i' } } : {} //* SEARCH OR GET ALL SUPER ADMINS
      const result = await SuperAdminModel.paginate(query, options)

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

//* GET SUPER ADMIN BY ID
module.exports.get_superAdmins_by_id = async (req, res) => {
  //* ONLY ADMINS CAN GET ALL SUPER ADMINS BY ID
  if (req?.superAdmin?.role !== 'superAdmin')
    return res.status(401).json({ message: 'unauthorized' })

  try {
    //* GETTING THE DETAILS IN THE PARAMS
    const { superAdminId } = req.params

    //* CHECKING IF ITS A VALID SUPER ADMIN ID
    if (!mongoose.isValidObjectId(req.params.superAdminId))
      return res.status(400).json({ error: 'invalid superAdmin id' })

    //* GETTING THE SUPER ADMIN
    const getSuperAdmin = await SuperAdminModel.findById(superAdminId)
      .select('-password')
      .populate({ path: 'wishList', select: 'title price -_id countInStock' })

    //* IF SUPER ADMIN ISN'T FOUND
    if (!getSuperAdmin) {
      return res.status(404).json({ message: 'superAdmin not found' })
    } else {
      return res.status(200).json({ superAdmin: getSuperAdmin })
    }
  } catch (err) {
    res.status(400).json({ status: 'bad request', error: err })
  }
}

//* GET SUPER ADMIN COUNTS
module.exports.get_superAdmins_counts = async (req, res) => {
  //* ONLY ADMINS CAN GET ALL SUPER ADMINS COUNTS
  if (req?.superAdmin?.role !== 'superAdmin')
    return res.status(401).json({ message: 'unauthorized' })

  try {
    //* GET COUNTS
    const counts = await SuperAdminModel.countDocuments()

    //* IF NOT REGISTERED SUPER ADMIN
    if (!counts) return res.status(404).json({ counts: 0 })

    //* SEND THE COUNTS OF ALL REGISTERED SUPER ADMIN
    res.status(200).json({ counts: counts })
  } catch (err) {
    res.status(400).json({ status: 'bad request', error: err })
  }
}

//* REGISTER SUPER ADMIN
module.exports.post_register = async (req, res) => {
  //* ONLY LOGGED IN SUPER ADMINS CAN REGISTER
  if (req?.superAdmin?.role !== 'superAdmin')
    return res.status(401).json({ message: 'unauthorized' })

  //* VALIDATING SUPER ADMIN REGISTER SCHEMA
  const { error } = superAdminRegisterSchemaValidation(req.body)
  if (error) return res.status(422).json(error.details[0].message)

  try {
    //* ACCESSING THE DETAILS IN THE BODY
    const { email, superAdminName, password, mobile, country, address } =
      req.body

    //* CHECKING IF THE MOBILE NUMBER IS ALREADY EXISTS
    const mobileExists = await SuperAdminModel.findOne({ mobile })

    //* IF MOBILE EXISTS
    if (mobileExists)
      return res.status(400).json({ message: 'mobile number already taken' })

    //* CHECKING IF THE SUPER ADMIN EXIST BEFORE REGISTRATION
    const newSuperAdminExist = await SuperAdminModel.findOne({ email })

    //* IF YOUR EXISTS
    if (newSuperAdminExist)
      return res
        .status(406)
        .json({ message: 'not accepted , superAdmin already exist' })

    //* IF SUPER ADMIN DOESN'T EXITS REGISTER A SUPER ADMIN
    const newSuperAdmin = new SuperAdminModel({
      email,
      mobile,
      superAdminName,
      password,
      country,
      address,
    })

    //* SAVE THE SUPER ADMIN IN THE DB
    await newSuperAdmin.save()

    //* IF ERROR OCCURS DURING REGISTRATION
    if (!newSuperAdmin) {
      return res.status(500).json({
        success: false,
        status: 'internet error',
        message: 'superAdmin not created',
      })
    } else {
      //* SENDING THE SUPER ADMINS TOKEN IN A COOKIE AND A EXPIRATION DATE
      const token = createToken(newSuperAdmin.id)
      res.cookie('superAdmin', token, { maxAge: maxAge * 1000, httpOnly: true })
      //* SEND A SUCCESS RESPONSE TO THE CLIENT AND THE SUPER ADMIN IS LOGGED IN IMMEDIATELY
      return res.status(201).json({ registered: newSuperAdmin })
    }
  } catch (error) {
    console.log(error)
  }
}

//* UPDATE SUPER ADMIN
module.exports.updateSuperAdmin = async (req, res) => {
  //* ONLY LOGGED IN SUPER ADMINS CAN UPDATE THEIR INFO
  if (req?.superAdmin?.role !== 'superAdmin')
    return res.status(401).json({ message: 'unauthorized' })

  //* VALIDATING THE DETAILS IN THE BODY
  const { error } = superAdminUpdateSchemaValidation(req.body)
  if (error) return res.status(400).json(error.details[0].message)

  //* GETTING THE LOGGED IN SUPER ADMIN ID
  const { _id } = req.superAdmin

  //* ACCESSING THE DETAILS IN THE BODY
  const { superAdminName, mobile, country, address } = req.body

  try {
    //* GET THE SUPER ADMIN AND UPDATE....
    //! ONLY LOGGED IN SUPER ADMIN CAN UPDATE THEIR SELF
    const superAdmin = await SuperAdminModel.findByIdAndUpdate(
      { _id },
      {
        superAdminName: superAdminName,
        mobile: mobile,
        country: country,
        address: address,
      },
      { new: true }
    )

    //* IF ERROR OCCURS DURING THE UPDATE ...
    if (!superAdmin)
      return res
        .status(500)
        .json({ status: 'internet error', message: 'not updated ' })

    //* SEND A SUCCESS RESPONSE TO THE CLIENT
    res.status(200).json({ updated: superAdmin })
  } catch (error) {
    console.log({ error })
  }
}

//* UPDATE SUPER ADMIN BY ID
module.exports.put_update_superAdmin_By_Id = async (req, res) => {
  //* ONLY ADMINS CAN UPDATE SUPER ADMIN BY ID
  if (req?.superAdmin?.role !== 'superAdmin')
    return res.status(401).json({ message: 'unauthorized' })

  //* VALIDATING THE DETAILS IN THE BODY
  const { error } = superAdminUpdateSchemaValidation(req.body)
  if (error) return res.status(400).json(error.details[0].message)

  //* GETTING THE SUPER ADMIN ID IN THE PARAMS
  const { superAdminId } = req.params

  //* CHECKING IF THE SUPER ADMIN ID IS VALID
  if (!mongoose.isValidObjectId(req.params.superAdminId))
    return res.status(400).json({ error: 'invalid superAdmin id' })

  //* GETTING THE DETAILS IN THE BODY
  const { superAdminName, country, mobile, address } = req.body

  //* CHECKING IF MOBILE NUMBER EXIST BEFORE UPDATING....
  const mobileExists = await SuperAdminModel.findOne({ mobile })

  //* IF EXISTS ....
  if (mobileExists)
    return res
      .status(406)
      .json({ status: 'not accepted', message: 'mobile already exists' })

  try {
    //* UPDATE THE SUPER ADMIN
    const updateSuperAdmin = await SuperAdminModel.findByIdAndUpdate(
      superAdminId,
      {
        superAdminName: superAdminName,
        country: country,
        mobile: mobile,
        address: address,
      },
      {
        new: true,
      }
    ).select('-password')

    //* IF ERROR OCCURS DURING UPDATE
    if (!updateSuperAdmin) {
      return res.status(500).json({
        success: false,
        status: 'internet error',
        message: 'superAdmin not updated',
      })
    } else {
      //* SENDING THE UPDATED SUPER ADMIN TO THE CLIENT
      return res.status(200).send({ updated: updateSuperAdmin })
    }
  } catch (err) {
    res.status(400).json({ status: 'bad request', error: err })
  }
}

//* LOGIN SUPER ADMIN
module.exports.post_login = async (req, res) => {
  //* GETTING THE DETAILS IN THE BODY
  const { email, password } = req.body

  try {
    //* CHECKING IF THE EMAIL IS REGISTERED
    const superAdmin = await SuperAdminModel.findOne({ email })

    //* IF IT ISN'T REGISTERED
    if (!superAdmin) return res.status(400).json({ message: 'email not found' })

    //* IF REGISTERED THEN .... COMPARE THE PASSWORDS
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
      //* CREATE A LOGIN TOKEN FOR THE SUPER ADMIN
      const Token = jwt.sign(
        {
          superAdminId: superAdmin.id,
          role: superAdmin.role,
        },
        keys.SECRET,
        {
          expiresIn: maxAge,
        }
      )
      //* STORE THE TOKEN IN A COOKIE
      res.cookie('user', Token, {
        maxAge: maxAge * 1000,
        httpOnly: true,
      })

      //* SEND A SUCCESS RESPONSE TO THE CLIENT
      res
        .status(200)
        .json({ logged_in: superAdmin.email, message: 'access granted' })
    } else {
      //* SEND INCORRECT PASSWORD TO THE CLIENT
      res.status(406).json({
        status: 'unaccepted',
        message: 'incorrect password please check your password and try again',
      })
    }
  } catch (error) {
    console.log(error)
    res.status(400).json({ status: 'bad request' })
  }
}

//* LOG OUT SUPER ADMIN
module.exports.post_logOut = async (req, res) => {
  //* ONLY LOGGED IN SUPER ADMIN CAN LOG OUT
  if (req?.superAdmin?.role !== 'superAdmin')
    return res.status(401).json({ message: 'unauthorized' })

  //* GETTING THE ID OF THE LOGGED IN SUPER ADMIN
  const loggedInSuperAdminId = req.superAdmin._id

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
  res.cookie('user', '', {
    maxAge: 1,
    httpOnly: true,
  })

  //* SEND A SUCCESS RESPONSE TO THE CLIENT
  res.status(200).json({
    status: 'success',
    message: 'superAdmin logged out',
    active: findSuperAdmin.active,
  })
}

//* BLOCK A SUPER ADMIN
module.exports.blockSuperAdminById = async (req, res) => {
  //* ONLY ADMINS CAN BLOCK SUPER ADMIN
  if (req?.superAdmin?.role !== 'superAdmin')
    return res.status(401).json({ message: 'unauthorized' })

  //* CHECKING IF ID IS VALID
  if (!mongoose.isValidObjectId(req.params.superAdminId))
    return res.status(404).json({
      status: 'not found',
      message: 'no superAdmin with such id found',
    })

  //* GETTING THE SUPER ADMIN ID IN THE PARAMS
  const { superAdminId } = req.params

  try {
    //* IF SUPER ADMIN WITH ID EXISTS ....
    const blockSuperAdmin = await SuperAdminModel.findByIdAndUpdate(
      superAdminId,
      {
        isBlocked: true,
      },
      {
        new: true,
      }
    )

    //* IF ERROR OCCURS DURING THE PROCESS
    if (!blockSuperAdmin)
      return res
        .status(500)
        .json({ status: 'internet error', error: 'superAdmin not blocked' })

    //* SEND A SUCCESS RESPONSE TO THE CLIENT
    res.status(201).json({ status: 'success', message: 'superAdmin blocked' })
  } catch (err) {
    res.status(400).json({ error: err })
  }
}

//* UNBLOCK SUPER ADMIN
module.exports.unBlockSuperAdminById = async (req, res) => {
  //* ONLY ADMINS CAN UNBLOCK
  if (req?.superAdmin?.role !== 'superAdmin')
    return res.status(401).json({ message: 'unauthorized' })

  //* CHECKING IF ID IS VALID
  if (!mongoose.isValidObjectId(req.params.superAdminId))
    return res.status(404).json({
      status: 'not found',
      message: 'no such superAdmin with that id  found',
    })

  //* GETTING THE SUPER ADMIN ID THE PARAMS
  const { superAdminId } = req.params

  try {
    //* IF SUPER ADMIN WITH SUCH ID EXIST .....
    const blockSuperAdmin = await SuperAdminModel.findByIdAndUpdate(
      superAdminId,
      {
        isBlocked: false,
      },
      {
        new: true,
      }
    )

    //* IF OCCUR OCCURS DURING PROCESS ....
    if (!blockSuperAdmin)
      return res
        .status(500)
        .json({ status: 'internet error', error: 'superAdmin not unblocked' })

    res.status(200).json({ status: 'success', message: 'superAdmin unblocked' })
  } catch (err) {
    res.status(400).json({ status: ' bad request', error: err })
  }
}

//* CHANGE SUPER ADMIN PASSWORD
module.exports.changeSuperAdminPassword = async (req, res) => {
  //* ONLY LOGGED IN SUPER ADMINS CAN CHANGE PASSWORD
  if (req?.superAdmin?.role !== 'superAdmin')
    return res.status(401).json({ message: 'unauthorized' })

  //* VALIDATING THE SUPER ADMINS DETAILS IN THE BODY
  const { error } = resetAndChangePasswordValidation(req.body)
  //* IF ERROR OCCURS
  if (error)
    return res
      .status(422)
      .json({ status: 'unprocessed entity', error: error.details[0].message })

  //* GETTING THE DETAILS IN THE BODY
  const { oldPassword, newPassword } = req.body

  //* ONLY LOGGED IN SUPER ADMINS CAN CHANGE PASSWORD
  const loggedInSuperAdminId = req.superAdmin._id

  try {
    //* GETTING THE LOGGED IN SUPER ADMIN
    const superAdmin = await SuperAdminModel.findById(loggedInSuperAdminId)

    //* COMPARE OLD PASSWORD BEFORE CHANGING
    const oldPasswordIsMatched = await superAdmin.comparePassword(oldPassword)

    //*  IF OLD PASSWORD ISN'T CORRECT
    if (!oldPasswordIsMatched) {
      return res.status(400).json({ Message: 'incorrect old password' })
    } else {
      //* IF CORRECT OLD PASSWORD THEN PROCEED....
      await superAdmin.createPasswordResetToken()
      superAdmin.password = newPassword
    }

    //* SAVE THE SUPER ADMIN CHANGES
    await superAdmin.save()

    //* SEND A SUCCESS RESPONSE TO THE CLIENT
    return res
      .status(200)
      .json({ superAdmin: superAdmin.email, message: 'password updated' })
  } catch (error) {
    console.log(error)
  }
}

//* FORGOTTEN PASSWORD
module.exports.forgottenPassword = async (req, res) => {
  //* VALIDATING THE EMAIL IN THE BODY
  const { error } = forgottenPassword(req.body)
  if (error) return res.status(400).json(error.details[0].message)

  //* GETTING THE DETAILS IN THE BODY
  const { email } = req.body

  try {
    //* GETTING THE SUPER ADMIN WITH THE PROVIDED EMAIL
    const superAdmin = await SuperAdminModel.findOne({ email })

    //* IF SUPER ADMIN ISN'T FOUND
    if (!superAdmin) {
      return res
        .status(404)
        .json({ message: 'no superAdmin with this email found' })
    } else {
      //* SEND A RESET EMAIL LINK TO THE SUPER ADMIN AND RESET SUPER ADMIN PASSWORD
      const resetToken = await superAdmin.createPasswordResetToken()

      //* SEND A RESET LINK
      const resetUrl = `Hi , please clink the link to reset your password , link is only valid for 10min <a href = 'http://localhost:4000/api/eshop/superAdmin/resetToken/${resetToken}'>click here</a>`

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
  //* VALIDATING THE DETAILS IN THE BODY
  const { error } = resetAndChangePasswordValidation(req.body)
  if (error)
    return res
      .status(422)
      .send({ status: 'unprocessed entity', error: error.details[0].message })

  //* GETTING THE TOKEN IN THE PARAMS
  const { token } = req.params

  //* GETTING THE DETAILS IN THE BODY
  const { newPassword } = req.body

  try {
    //* HASH THE PROVIDED TOKEN IN THE PARAMS
    const hashToken = crypto.createHash('sha256').update(token).digest('hex')

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

//* DELETE SUPER ADMIN BY ID
module.exports.delete_superAdmin = async (req, res) => {
  //* ONLY ADMINS CAN DELETE SUPER ADMIN BY ID
  if (req?.superAdmin?.role !== 'superAdmin')
    return res.status(401).json({ message: 'unauthorized' })

  //* CHECKING IF ITS A VALID SUPER ADMIN ID
  if (!mongoose.isValidObjectId(req.params.superAdminId))
    return res.status(400).json({ error: 'invalid superAdmin id' })

  //* GETTING THE SUPER ADMIN ID IN THE PARAMS
  const { superAdminId } = req.params

  try {
    //* FIND THE SUPER ADMIN AND DELETE
    const delSuperAdmin = await SuperAdminModel.findByIdAndDelete(superAdminId)

    //* IF SUPER ADMIN  ISN'T DELETED
    if (!delSuperAdmin) {
      return res
        .status(500)
        .json({ status: 'internet error', message: 'superAdmin not deleted' })
    } else {
      //* SEND A SUCCESS RESPONSE TO THE CLIENT
      return res
        .status(200)
        .send({ success: true, message: 'superAdmin deleted successful' })
    }
  } catch (error) {
    console.log(error)
  }
}

//* ADD PRODUCT TO WISHLIST
module.exports.addToWishList = async (req, res) => {
  //* ONLY LOGGED IN SUPER ADMINS CAN ADD PRODUCT TO WISHLIST
  if (req?.superAdmin?.role !== 'superAdmin')
    return res.status(401).json({ message: 'unauthorized' })

  //* ACCESSING THE DETAILS IN THE BODY
  const { productId } = req.body

  //* GETTING THE LOGGED IN SUPER ADMIN ID
  const loggedInSuperAdminId = req.superAdmin._id

  try {
    const product = await ProductModel.findById(productId)

    if (!product) return res.status(404).json({ message: 'product not found' })

    //* GET THE SUPER ADMIN ID
    const superAdmin = await SuperAdminModel.findById(loggedInSuperAdminId)

    //* CHECK IF THE PRODUCT HAS BEEN ADDED TO WISHLIST
    const alreadyAdded = superAdmin.wishList.find(
      (id) => id.toString() === productId.toString()
    )

    //* CLICK THE SEND BUTTON TO ADD THE PRODUCT OR DOUBLE CLICK THE SEND BUTTON TO REMOVE THE PRODUCT
    if (alreadyAdded) {
      //* UPDATE THE SUPER ADMIN WISHLIST
      superAdmin.wishList.pull(productId)

      //* SAVE THE SUPER ADMIN
      await superAdmin.save(product)

      //* SEND A RESPONSE TO THE CLIENT
      return res.status(200).json({ superAdmin })
    } else {
      //* ADD THE PRODUCT TO WISH LIST
      superAdmin.wishList.push(productId)

      //* SAVE THE SUPER ADMIN
      await superAdmin.save(product)

      //* SEND A RESPONSE TO THE CLIENT
      return res.status(200).json({ superAdmin })
    }
  } catch (error) {
    console.log(error)
  }
}

//* GET SUPER ADMIN WISHLIST
module.exports.getWishList = async (req, res) => {
  //* ONLY LOGGED IN SUPER ADMIN CAN GET THEIR WISHLIST
  if (req?.superAdmin?.role !== 'superAdmin')
    return res.status(401).json({ message: 'unauthorized' })
  //* GETTING THE LOGGED IN SUPER ADMIN ID
  const loggedInSuperAdminId = req.superAdmin._id

  try {
    //* FIND THE SUPER ADMIN WITH THE ID
    const superAdmin = await SuperAdminModel.findById(loggedInSuperAdminId)
      .populate({
        path: 'wishList',
        populate: { path: 'category', select: 'title -_id' },
      })
      .populate({
        path: 'wishList',
        populate: { path: 'brand', select: 'title -_id' },
      })

    //* IF SUPER ADMIN EXISTS
    if (!superAdmin)
      return res.status(404).json({ message: 'superAdmin is not found' })

    //* SEND A SUCCESS RESPONSE TO THE CLIENT
    res.status(200).json({ wishList: superAdmin.wishList })
  } catch (err) {
    console.log({ error: err })
  }
}

//* ADD ADDRESS
module.exports.add_Address = async (req, res) => {
  //* ONLY LOGGED IN SUPER ADMIN CAN ADD ADDRESS
  if (req?.superAdmin?.role !== 'superAdmin')
    return res.status(401).json({ message: 'unauthorized' })

  //* GET THE LOGGED IN SUPER ADMIN ID
  const loggedInSuperAdminId = req.superAdmin._id

  //* GETTING THE DETAILS IN THE BODY
  const { address } = req.body

  try {
    //* FIND THE SUPER ADMIN AND UPDATE
    const superAdmin = await SuperAdminModel.findByIdAndUpdate(
      loggedInSuperAdminId,
      {
        address: address,
      },
      {
        new: true,
      }
    )

    //* IF SUPER ADMIN ISN'T FOUND
    if (!superAdmin)
      return res
        .status(404)
        .json({ status: 'not found', message: 'superAdmin not found' })

    //* SEND A SUCCESS RESPONSE TO THE SUPER ADMIN
    res.status(200).json({
      status: 'success',
      message: 'new address added',
      address: superAdmin.address,
    })
  } catch (error) {
    console.log({ error: err })
  }
}

//* ADD TO CART
module.exports.addToCart = async (req, res) => {
  //* ONLY LOGGED IN SUPER ADMIN CAN ADD TO CART
  if (req?.superAdmin?.role !== 'superAdmin')
    return res.status(401).json({ message: 'unauthorized' })

  //* GETTING THE DETAILS IN THE BODY
  const { cart } = req.body

  //* GETTING THE LOGGED IN SUPER ADMIN ID
  const { _id } = req.superAdmin

  try {
    //* MAKING THE PRODUCTS AN EMPTY ARRAY
    let products = []

    //* FINDING THE LOGGED IN SUPER ADMIN
    const superAdmin = await SuperAdminModel.findById({ _id })

    //* IF SUPER ADMIN DON'T EXISTS  .....
    if (!superAdmin)
      return res.status(404).json({ message: ' superAdmin not found' })

    //* CHECKING IF THE SUPER ADMIN  ALREADY HAS A CART
    const alreadyCart = await SuperAdminModel.findOne({
      orderBy: superAdmin._id,
    })

    //* IF YES ... REMOVE THE SUPER ADMIN CART
    if (alreadyCart) {
      alreadyCart.remove()
    }

    //* LOOP THROUGH THE EMPTY CART
    for (let i = 0; i < cart.length; i++) {
      //* DECLARE AN EMPTY OBJECT
      const object = {}

      //* ASSIGN THE OBJECTS PROPERTIES TO THE CART PROPERTIES
      object.product = cart[i]._id
      object.count = cart[i].count
      object.color = cart[i].color

      //* GET PRODUCT PRICE
      const getPrice = await ProductModel.findById(cart[i]._id)
        .select('price')
        .exec()

      //* ASSIGN THE OBJECT PRICE PROPERTY TO THE CART PROPERTY
      object.price = getPrice.price

      //*  PUSH THE OBJECTS TO THE EMPTY PRODUCT ARRAY
      products.push(object)
    }

    //* CALCULATE CART TOTAL
    let CartTotal = 0

    //* LOOP THROUGH THE PRODUCTS
    for (let i = 0; i < products.length; i++) {
      CartTotal = CartTotal + products[i].price * products[i].count
    }

    //* CREATE A NEW CART
    const newCart = await new CartModel({
      products,
      CartTotal,
      orderBy: superAdmin._id,
    }).populate({ path: 'products.product', select: 'title' })

    //* SAVE THE CHANGES
    await newCart.save()

    //* SEND A SUCCESS RESPONSE TO THE CLIENT
    res.status(200).json({ cart: newCart })
  } catch (error) {
    console.log({ error })
  }
}

//* GET SUPER ADMIN CART
module.exports.getSuperAdminCart = async (req, res) => {
  //* ONLY LOGGED IN SUPER ADMIN CAN GET THEIR CART LIST
  if (req?.superAdmin?.role !== 'superAdmin')
    return res.status(401).json({ message: 'unauthorized' })

  //*  GET THE LOGGED IN SUPER ADMIN ID
  const { _id } = req.superAdmin

  try {
    //* FIND THE LOGGED IN SUPER ADMIN
    const superAdmin = await SuperAdminModel.findOne({ _id })

    //* IF SUPER ADMIN NOT FOUND
    if (!superAdmin)
      return res.status(404).json({ message: 'superAdmin not found' })

    //* GET THE LOGGED IN SUPER ADMIN CART
    const getCart = await CartModel.findOne({ orderBy: superAdmin._id })

    //* IF NO ITEMS IN CART .....
    if (!getCart) return res.status(404).json({ message: 'no items in cart' })

    //* SEND THE CART TO THE CLIENT
    res.status(200).json({ cart: getCart })
  } catch (error) {
    console.log({ error })
  }
}

//* EMPTY CART
module.exports.emptyCart = async (req, res) => {
  //* ONLY LOGGED IN SUPER ADMINS CAN LOG OUT
  if (req?.superAdmin?.role !== 'superAdmin')
    return res.status(401).json({ message: 'unauthorized' })
  //* GETTING THE LOGGED IN SUPER ADMIN ID
  const { _id } = req.superAdmin

  try {
    //* FIND THE LOGGED IN SUPER ADMIN
    const superAdmin = await SuperAdminModel.findOne({ _id })

    //* GET THE LOGGED IN SUPER ADMIN CART AND REMOVE
    const cart = await CartModel.findOneAndRemove({ orderBy: superAdmin._id })

    //* IF CART ISN'T REMOVED
    if (!cart) return res.status(404).json({ message: ' no cart available' })

    //* SEND A SUCCESS RESPONSE TO THE CLIENT
    res.status(200).json({ message: 'cart empty' })
  } catch (error) {
    console.log({ error })
  }
}

//* APPLY DISCOUNT TO CART
module.exports.applyDiscount = async (req, res) => {
  //* ONLY LOGGED IN SUPER ADMINS CAN APPLY DISCOUNT TO CART
  if (req?.superAdmin?.role !== 'superAdmin')
    return res.status(401).json({ message: 'unauthorized' })

  //* GETTING THE LOGGED IN SUPER ADMIN
  const { _id } = req.superAdmin

  //* ACCESS THE DETAILS IN THE BODY
  const { coupon } = req.body

  //* FIND THE LOGGED IN SUPER ADMIN
  const superAdmin = await SuperAdminModel.findOne({ _id })

  //* GETTING THE COUPON
  const ValidCoupon = await CouponModel.findOne({ name: coupon })

  //* IF COUPON  DOESN'T EXIST
  if (!ValidCoupon)
    return res.status(404).json({ message: 'coupon not found or expired' })

  //* GET THE LOGGED IN SUPER ADMIN CART
  const { CartTotal } = await CartModel.findOne({
    orderBy: superAdmin._id,
  }).populate({ path: 'products', populate: { path: 'product' } })

  //* CALCULATE THE TOTAL AFTER DISCOUNT
  let totalAfterDiscount = (
    CartTotal -
    (CartTotal * ValidCoupon.discount) / 100
  ).toFixed(2)

  //* UPDATE THE TOTAL AFTER DISCOUNT PROPERTY IN THE CART
  await CartModel.findOneAndUpdate(
    { orderBy: superAdmin._id },
    {
      totalAfterDiscount,
    },
    {
      new: true,
    }
  )

  //* SEND THE TOTAL AFTER DISCOUNT AMOUNT TO THE CLIENT
  res.status(200).json({ totalAfterDiscount })
}

//* CREATE ORDER FOR ITEMS IN THE CART
module.exports.createOrder = async (req, res) => {
  //* ONLY LOGGED IN SUPER ADMIN CAN CREATE ORDER
  if (req?.superAdmin?.role !== 'superAdmin')
    return res.status(401).json({ message: 'unauthorized' })

  //* GETTING THE LOGGED IN SUPER ADMIN  ID
  const { _id } = req.superAdmin

  //* ACCESSING THE DETAILS IN THE BODY
  const { COD, couponApplied } = req.body

  //* IF IT'S NOT CASH ON DELIVERY
  if (!COD) return res.status(400).json({ message: ' cash on delivery failed' })

  try {
    //* GETTING THE LOGGED IN SUPER ADMIN
    const superAdmin = await SuperAdminModel.findById({ _id })

    //* GETTING THE LOGGED IN SUPER ADMIN CART
    const superAdminCart = await CartModel.findOne({ orderBy: superAdmin._id })

    //* IF NOT CART...
    if (!superAdminCart)
      return res.status(404).json({ message: 'no cart available' })

    //* CALCULATE THE TOTAL AMOUNTS
    let totalAmount = 0
    if (couponApplied && superAdminCart.totalAfterDiscount) {
      totalAmount = superAdmin.totalAfterDiscount
    } else {
      totalAmount = superAdmin.CartTotal
    }

    //* CREATE NEW ORDER
    const newOrder = await OrderModel.create({
      products: superAdminCart.products,
      paymentIntent: {
        id: uniqid(),
        status: 'Not Processed',
        currency: 'usd',
        createdAt: Date.now(),
      },
      orderBy: superAdmin._id,
    })

    //* UPDATE THE PRODUCT COUNT IN STOCK AND SOLD
    const update = superAdminCart.products.map((item) => {
      return {
        updateOne: {
          filter: { _id: item.product._id },
          update: {
            $inc: { countInStock: -item.countInStock, sold: +item.sold },
          },
        },
      }
    })

    //* BULK WRITE THE UPDATE
    await ProductModel.bulkWrite(update, {})

    //* SEND A SUCCESS RESPONSE
    res.status(200).json({ status: 'success', message: 'order booked' })
  } catch (error) {
    console.log({ error })
  }
}

//* GET ORDER
module.exports.getOrder = async (req, res) => {
  //* ONLY LOGGED IN SUPER ADMIN CAN GET THEIR ORDER LIST
  if (req?.superAdmin?.role !== 'superAdmin')
    return res.status(401).json({ message: 'unauthorized' })

  //* GETTING LOGGED IN SUPER ADMIN
  const { _id } = req.superAdmin

  try {
    //* FIND THE LOGGED  IN SUPER ADMIN
    const superAdmin = await SuperAdminModel.findOne({ _id })

    //* FIND THE SUPER ADMIN ORDER
    const findOrder = await OrderModel.findOne({ orderBy: superAdmin._id })
      .populate({
        path: 'products.product',
        select: ' -_id title count',
      })
      .populate({ path: 'orderBy', select: 'superAdminName' })

    //* IF ORDER ISN'T FOUND
    if (!findOrder) return res.status(404).json({ message: 'no orders placed' })

    //* SEND THE ORDERS TO THE SUPER ADMIN
    res.status(200).json({ orders: findOrder })
  } catch (error) {
    console.log({ error })
  }
}

//* GET ACTIVE  SUPER ADMINS COUNTS
module.exports.getActiveSuperAdminsCounts = async (req, res) => {
  //* ONLY LOGGED IN ADMINS CAN GET ALL ACTIVE SUPER ADMINS COUNTS
  if (req?.superAdmin?.role !== 'superAdmin')
    return res.status(401).json({ message: 'unauthorized' })

  //* GETTING ALL ACTIVE SUPER ADMIN COUNTS
  const activeCount = await SuperAdminModel.countDocuments({ active: true })

  //* IF NO ACTIVE ADMINS....
  if (!activeCount) return res.status(404).json({ active_Admins: 0 })

  //* SEND A SUCCESS RESPONSE
  res.status(200).json({ active_SuperAdmins: activeCount })
}

//* GET OFFLINE  SUPER ADMINS COUNTS
module.exports.getOfflineSuperAdminsCounts = async (req, res) => {
  //* ONLY LOGGED IN ADMINS CAN GET ALL OFFLINE SUPER ADMINS COUNTS
  if (req?.superAdmin?.role !== 'superAdmin')
    return res.status(401).json({ message: 'unauthorized' })

  //* GETTING ALL OFFLINE ADMINS
  const offlineCount = await AdminModel.countDocuments({ active: false })

  //* IF NO OFFLINE SUPER ADMIN
  if (!offlineCount) return res.status(404).json({ offline: 0 })

  //* SEND A SUCCESS RESPONSE
  res.status(200).json({ offline_SuperAdmins: offlineCount })
}
