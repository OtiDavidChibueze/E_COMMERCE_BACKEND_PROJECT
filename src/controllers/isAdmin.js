//* ADMIN CONTROLLER
const AdminModel = require('../model/isAdmin')
const ProductModel = require('../model/product')
const CartModel = require('../model/cart')

const jwt = require('jsonwebtoken')
const { maxAge, createToken } = require('../jwt/isAdminToken')

const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const uniqid = require('uniqid')

const {
  adminRegisterSchemaValidation,
  adminUpdateSchemaValidation,
  resetAndChangePasswordValidation,
  forgottenPassword,
} = require('../Validations/schema/isAdmin')

const keys = require('../config/keys')
const sendEmail = require('./nodeMailer')
const CouponModel = require('../model/coupon')
const OrderModel = require('../model/order')

//*  ADMIN END POINTS

//* GET ALL ADMINS
module.exports.get_All_Admins_And_Also_Search_Admins_With_Emails = async (
  req,
  res
) => {
  try {
    //* QUERY OPTIONS
    const options = {
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 5,
    }

    //*  LOOK FOR ADMINS USING THEIR EMAIL OR GET ALL ADMINS
    const search = req.query.search
    const query = search ? { email: { $regex: search, $options: 'i' } } : {} //* SEARCH OR GET ALL ADMINS
    const result = await AdminModel.paginate(query, options)

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

//* GET ADMIN BY ID
module.exports.get_Admins_by_id = async (req, res) => {
  try {
    //* GETTING THE DETAILS IN THE PARAMS
    const { adminId } = req.params

    //* CHECKING IF ITS A VALID ADMIN ID
    if (!mongoose.isValidObjectId(req.params.adminId))
      return res.status(400).json({ error: 'invalid admin id' })

    //* GETTING THE ADMIN
    const getAdmin = await AdminModel.findById(adminId).select(
      '-password -_id -createdAt -updatedAt -__v'
    )

    //* IF ADMIN ISN'T FOUND
    if (!getAdmin) {
      return res.status(404).json({ message: 'admin not found' })
    } else {
      return res.status(200).json({ admin: getAdmin })
    }
  } catch (err) {
    res.status(400).json({ status: 'bad request', error: err })
  }
}

//* GET ADMIN COUNTS
module.exports.get_Admins_counts = async (req, res) => {
  try {
    //* GET COUNTS
    const counts = await AdminModel.countDocuments()

    //* IF NOT REGISTERED ADMIN
    if (!counts) return res.status(404).json({ counts: 0 })

    //* SEND THE COUNTS OF ALL REGISTERED ADMIN
    res.status(200).json({ counts: counts })
  } catch (err) {
    res.status(400).json({ status: 'bad request', error: err })
  }
}

//* REGISTER ADMIN
module.exports.post_register = async (req, res) => {
  //* VALIDATING ADMIN REGISTER SCHEMA
  const { error } = adminRegisterSchemaValidation(req.body)
  if (error) return res.status(422).json(error.details[0].message)

  try {
    //* ACCESSING THE DETAILS IN THE BODY
    const { email, adminName, password, mobile, country, address } = req.body

    //* CHECKING IF THE MOBILE NUMBER IS ALREADY EXISTS
    const mobileExists = await AdminModel.findOne({ mobile })

    //* IF MOBILE EXISTS
    if (mobileExists)
      return res.status(400).json({ message: 'mobile number already taken' })

    //* CHECKING IF THE ADMIN EXIST BEFORE REGISTRATION
    const newAdminExist = await AdminModel.findOne({ email })

    //* IF YOUR EXISTS
    if (newAdminExist)
      return res
        .status(406)
        .json({ message: 'not accepted , admin already exist' })

    //* IF ADMIN DOESN'T EXITS REGISTER A ADMIN
    const newAdmin = new AdminModel({
      email,
      mobile,
      adminName,
      password,
      country,
      address,
    })

    //* SAVE THE ADMIN IN THE DB
    await newAdmin.save()

    //* IF ERROR OCCURS DURING REGISTRATION
    if (!newAdmin) {
      return res.status(500).json({
        success: false,
        status: 'internet error',
        message: 'admin not created',
      })
    } else {
      //* SENDING THE ADMINS TOKEN IN A COOKIE AND A EXPIRATION DATE
      const token = createToken(newAdmin._id)
      res.cookie('admin', token, { maxAge: maxAge * 1000, httpOnly: true })
      //* SEND A SUCCESS RESPONSE TO THE CLIENT AND THE ADMIN IS LOGGED IN IMMEDIATELY
      return res.status(201).json({ registered: newAdmin })
    }
  } catch (error) {
    console.log(error)
  }
}

//* UPDATE ADMIN
module.exports.updateAdmin = async (req, res) => {
  //* VALIDATING THE DETAILS IN THE BODY
  const { error } = adminUpdateSchemaValidation(req.body)
  if (error) return res.status(400).json(error.details[0].message)

  //* GETTING THE LOGGED IN ADMIN ID
  const { _id } = req.admin

  //* ACCESSING THE DETAILS IN THE BODY
  const { adminName, mobile, country, address } = req.body

  try {
    //* GET THE ADMIN AND UPDATE....
    //! ONLY LOGGED IN ADMIN CAN UPDATE THEIR SELF
    const admin = await AdminModel.findByIdAndUpdate(
      { _id },
      {
        adminName: adminName,
        mobile: mobile,
        country: country,
        address: address,
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
module.exports.put_update_Admin_By_Id = async (req, res) => {
  //* VALIDATING THE DETAILS IN THE BODY
  const { error } = adminUpdateSchemaValidation(req.body)
  if (error) return res.status(400).json(error.details[0].message)

  try {
    //* GETTING THE ADMIN ID IN THE PARAMS
    const { adminId } = req.params

    //* VALIDATING SCHEMA
    const { error } = adminUpdateSchemaValidation(req.body)
    if (error) return res.status(422).send(error.details[0].message)

    //* CHECKING IF THE ADMIN ID IS VALID
    if (!mongoose.isValidObjectId(req.params.adminId))
      return res.status(400).json({ error: 'invalid admin id' })

    //* UPDATE THE ADMIN
    const updateAdmin = await AdminModel.findByIdAndUpdate(adminId, req.body, {
      new: true,
    })

    //* IF ERROR OCCURS DURING UPDATE
    if (!updateAdmin) {
      return res.status(500).json({
        success: false,
        status: 'internet error',
        message: 'admin not updated',
      })
    } else {
      //* SENDING THE UPDATED ADMIN TO THE CLIENT
      return res.status(200).send({ updated: updateAdmin })
    }
  } catch (err) {
    res.status(400).json({ status: 'bad request', error: err })
  }
}

//* LOGIN ADMIN
module.exports.post_login = async (req, res) => {
  //* GETTING THE DETAILS IN THE BODY
  const { email, password } = req.body

  try {
    //* CHECKING IF THE EMAIL IS REGISTERED
    const admin = await AdminModel.findOne({ email })

    //* IF IT ISN'T REGISTERED
    if (!admin) return res.status(400).json({ message: 'email not found' })

    //* IF REGISTERED THEN .... COMPARE THE PASSWORDS
    if (admin && bcrypt.compareSync(password, admin.password)) {
      //* IF PASSWORD CORRECT UPDATE THE ACTIVE STATUS
      await AdminModel.findOneAndUpdate(
        { email },
        {
          active: true,
        },
        {
          new: true,
        }
      )

      //* CREATE A LOGIN TOKEN FOR THE ADMIN
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

      //* SEND A SUCCESS RESPONSE TO THE CLIENT
      res.status(200).json({ logged_in: admin })
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

//* LOG OUT ADMIN
module.exports.post_logOut = async (req, res) => {
  //* ONLY LOGGED IN ADMIN CAN LOGOUT
  const loggedInAdminId = req.admin._id

  //* FIND THE ADMIN AND UPDATE THE ACTIVE STATUS
  const findAdmin = await AdminModel.findByIdAndUpdate(
    loggedInAdminId,
    {
      active: false,
    },
    {
      new: true,
    }
  )

  //* REMOVE THE TOKEN FROM THE COOKIE
  res.cookie('Admin', '', {
    maxAge: 1,
    httpOnly: true,
  })

  //* SEND A SUCCESS RESPONSE TO THE CLIENT
  res.status(200).json({
    status: 'success',
    message: 'admin logged out',
    active: findAdmin.active,
  })
}

//* BLOCK A ADMIN
module.exports.blockAdminById = async (req, res) => {
  //* GETTING THE ADMIN ID IN THE PARAMS
  const { adminId } = req.params

  try {
    //* CHECKING IF ID IS VALID
    if (!mongoose.isValidObjectId(req.params.adminId))
      return res
        .status(404)
        .json({ status: 'not found', message: 'no admin with such id found' })

    //* IF ADMIN WITH ID EXISTS ....
    const blockAdmin = await AdminModel.findByIdAndUpdate(
      adminId,
      {
        isBlocked: true,
      },
      {
        new: true,
      }
    )

    //* IF ERROR OCCURS DURING THE PROCESS
    if (!blockAdmin)
      return res
        .status(500)
        .json({ status: 'internet error', error: 'admin not blocked' })

    //* SEND A SUCCESS RESPONSE TO THE CLIENT
    res.status(201).json({ status: 'success', message: 'admin blocked' })
  } catch (err) {
    res.status(400).json({ error: err })
  }
}

//* UNBLOCK ADMIN
module.exports.unBlockAdminById = async (req, res) => {
  //* GETTING THE ADMIN ID THE PARAMS
  const { adminId } = req.params

  try {
    //* CHECKING IF ID IS VALID
    if (!mongoose.isValidObjectId(req.params.adminId))
      return res.status(404).json({
        status: 'not found',
        message: 'no such admin with that id  found',
      })

    //* IF ADMIN WITH SUCH ID EXIST .....
    const blockAdmin = await AdminModel.findByIdAndUpdate(
      adminId,
      {
        isBlocked: false,
      },
      {
        new: true,
      }
    )

    //* IF OCCUR OCCURS DURING PROCESS ....
    if (!blockAdmin)
      return res
        .status(500)
        .json({ status: 'internet error', error: 'admin not unblocked' })

    res.status(200).json({ status: 'success', message: 'admin unblocked' })
  } catch (err) {
    res.status(400).json({ status: ' bad request', error: err })
  }
}

//* CHANGE ADMIN PASSWORD
module.exports.changeAdminPassword = async (req, res) => {
  //* VALIDATING THE ADMINS DETAILS IN THE BODY
  const { error } = resetAndChangePasswordValidation(req.body)
  //* IF ERROR OCCURS
  if (error)
    return res
      .status(422)
      .json({ status: 'unprocessed entity', error: error.details[0].message })

  //* GETTING THE DETAILS IN THE BODY
  const { oldPassword, newPassword } = req.body

  //* ONLY LOGGED IN ADMINS CAN CHANGE PASSWORD
  const loggedInAdminId = req.admin._id

  try {
    //* GETTING THE LOGGED IN ADMIN
    const admin = await AdminModel.findById(loggedInAdminId)

    //* COMPARE OLD PASSWORD BEFORE CHANGING
    const oldPasswordIsMatched = await admin.comparePassword(oldPassword)

    //*  IF OLD PASSWORD ISN'T CORRECT
    if (!oldPasswordIsMatched) {
      return res.status(400).json({ Message: 'incorrect old password' })
    } else {
      //* IF CORRECT OLD PASSWORD THEN PROCEED....
      await admin.createPasswordResetToken()
      admin.password = newPassword
    }

    //* SAVE THE ADMIN CHANGES
    await admin.save()

    //* SEND A SUCCESS RESPONSE TO THE CLIENT
    return res
      .status(200)
      .json({ admin: admin.email, message: 'password updated' })
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
    //* GETTING THE ADMIN WITH THE PROVIDED EMAIL
    const admin = await AdminModel.findOne({ email })

    //* IF ADMIN ISN'T FOUND
    if (!admin) {
      return res.status(404).json({ message: 'no admin with this email found' })
    } else {
      //* SEND A RESET EMAIL LINK TO THE ADMIN AND RESET ADMIN PASSWORD
      const resetToken = await admin.createPasswordResetToken()

      //* SEND A RESET LINK
      const resetUrl = `Hi , please clink the link to reset your password , link is only valid for 10min <a href = 'http://localhost:4000/api/eshop/admin/resetToken/${resetToken}'>click here</a>`

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

    //* FIND THE ADMIN WITH THE HASHED TOKEN
    const admin = await AdminModel.findOne({
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

//* DELETE ADMIN BY ID
module.exports.delete_Admin = async (req, res) => {
  //* CHECKING IF ITS A VALID ADMIN ID
  if (!mongoose.isValidObjectId(req.params.adminId))
    return res.status(400).json({ error: 'invalid admin id' })

  //* GETTING THE ADMIN ID IN THE PARAMS
  const { adminId } = req.params

  try {
    //* FIND THE ADMIN AND DELETE
    const delAdmin = await AdminModel.findByIdAndDelete(adminId)

    //* IF ADMIN  ISN'T DELETED
    if (!delAdmin) {
      return res
        .status(500)
        .json({ status: 'internet error', message: 'admin not deleted' })
    } else {
      //* SEND A SUCCESS RESPONSE TO THE CLIENT
      return res
        .status(200)
        .send({ success: true, message: 'admin deleted successful' })
    }
  } catch (error) {
    console.log(error)
  }
}

//* ADD PRODUCT TO WISHLIST
module.exports.addToWishList = async (req, res) => {
  //* ACCESSING THE DETAILS IN THE BODY
  const { productId } = req.body

  //* GETTING THE LOGGED IN ADMIN ID
  const loggedInAdminId = req.admin._id

  try {
    const product = await ProductModel.findById(productId)

    if (!product) return res.status(404).json({ message: 'product not found' })

    //* GET THE ADMIN ID
    const admin = await AdminModel.findById(loggedInAdminId)

    //* CHECK IF THE PRODUCT HAS BEEN ADDED TO WISHLIST
    const alreadyAdded = admin.wishList.find(
      (id) => id.toString() === productId.toString()
    )

    //* CLICK THE SEND BUTTON TO ADD THE PRODUCT OR DOUBLE CLICK THE SEND BUTTON TO REMOVE THE PRODUCT
    if (alreadyAdded) {
      //* UPDATE THE ADMIN WISHLIST
      admin.wishList.pull(productId)

      //* SAVE THE ADMIN
      await admin.save(product)

      //* SEND A RESPONSE TO THE CLIENT
      return res.status(200).json({ admin })
    } else {
      //* ADD THE PRODUCT TO WISH LIST
      admin.wishList.push(productId)

      //* SAVE THE ADMIN
      await admin.save(product)

      //* SEND A RESPONSE TO THE CLIENT
      return res.status(200).json({ admin })
    }
  } catch (error) {
    console.log(error)
  }
}

//* GET ADMIN WISHLIST
module.exports.getWishList = async (req, res) => {
  //* GETTING THE LOGGED IN ADMIN ID
  const loggedInAdminId = req.admin._id

  try {
    //* FIND THE ADMIN WITH THE ID
    const admin = await AdminModel.findById(loggedInAdminId).populate(
      'wishList'
    )

    //* IF ADMIN EXISTS
    if (!admin) return res.status(404).json({ message: 'admin is not found' })

    //* SEND A SUCCESS RESPONSE TO THE CLIENT
    res.status(200).json({ wishList: admin.wishList })
  } catch (err) {
    console.log({ error: err })
  }
}

//* ADD ADDRESS
module.exports.add_Address = async (req, res) => {
  //* GET THE LOGGED IN ADMIN ID
  const loggedInAdminId = req.admin._id

  //* GETTING THE DETAILS IN THE BODY
  const { address } = req.body

  try {
    //* FIND THE ADMIN AND UPDATE
    const admin = await AdminModel.findByIdAndUpdate(
      loggedInAdminId,
      {
        address: address,
      },
      {
        new: true,
      }
    )

    //* IF ADMIN ISN'T FOUND
    if (!admin)
      return res
        .status(404)
        .json({ status: 'not found', message: 'admin not found' })

    //* SEND A SUCCESS RESPONSE TO THE ADMIN
    res.status(200).json({
      status: 'success',
      message: 'new address added',
      address: admin.address,
    })
  } catch (error) {
    console.log({ error: err })
  }
}

//* ADD TO CART
module.exports.addToCart = async (req, res) => {
  //* GETTING THE DETAILS IN THE BODY
  const { cart } = req.body

  //* GETTING THE LOGGED IN ADMIN ID
  const { _id } = req.admin

  try {
    //* MAKING THE PRODUCTS AN EMPTY ARRAY
    let products = []

    //* FINDING THE LOGGED IN ADMIN
    const admin = await AdminModel.findById({ _id })

    //* IF ADMIN DON'T EXISTS  .....
    if (!admin) return res.status(404).json({ message: ' admin not found' })

    //* CHECKING IF THE ADMIN  ALREADY HAS A CART
    const alreadyCart = await AdminModel.findOne({ orderBy: admin._id })

    //* IF YES ... REMOVE THE ADMIN CART
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
    const newCart = new CartModel({
      products,
      CartTotal,
      orderBy: admin._id,
    })

    //* SAVE THE CHANGES
    await newCart.save()

    //* SEND A SUCCESS RESPONSE TO THE CLIENT
    res.status(200).json({ cart: newCart })
  } catch (error) {
    console.log({ error })
  }
}

//* GET ADMIN CART
module.exports.getAdminCart = async (req, res) => {
  //*  GET THE LOGGED IN ADMIN ID
  const { _id } = req.admin

  try {
    //* FIND THE LOGGED IN ADMIN
    const admin = await AdminModel.findOne({ _id })

    //* IF ADMIN NOT FOUND
    if (!admin) return res.status(404).json({ message: 'admin not found' })

    //* GET THE LOGGED IN ADMIN CART
    const getCart = await CartModel.findOne({ orderBy: admin._id })

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
  //* GETTING THE LOGGED IN ADMIN ID
  const { _id } = req.admin

  try {
    //* FIND THE LOGGED IN ADMIN
    const admin = await AdminModel.findOne({ _id })

    //* GET THE LOGGED IN ADMIN CART AND REMOVE
    const cart = await CartModel.findOneAndRemove({ orderBy: admin._id })

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
  //* GETTING THE LOGGED IN ADMIN
  const { _id } = req.admin

  //* ACCESS THE DETAILS IN THE BODY
  const { coupon } = req.body

  //* FIND THE LOGGED IN ADMIN
  const admin = await AdminModel.findOne({ _id })

  //* GETTING THE COUPON
  const ValidCoupon = await CouponModel.findOne({ name: coupon })

  //* IF COUPON  DOESN'T EXIST
  if (!ValidCoupon)
    return res.status(404).json({ message: 'coupon not found or expired' })

  //* GET THE LOGGED IN ADMIN CART
  const { CartTotal } = await CartModel.findOne({
    orderBy: admin._id,
  }).populate({ path: 'products', populate: { path: 'product' } })

  //* CALCULATE THE TOTAL AFTER DISCOUNT
  let totalAfterDiscount = (
    CartTotal -
    (CartTotal * ValidCoupon.discount) / 100
  ).toFixed(2)

  //* UPDATE THE TOTAL AFTER DISCOUNT PROPERTY IN THE CART
  await CartModel.findOneAndUpdate(
    { orderBy: admin._id },
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
  //* GETTING THE LOGGED IN ADMIN  ID
  const { _id } = req.admin

  //* ACCESSING THE DETAILS IN THE BODY
  const { COD, couponApplied } = req.body

  //* IF IT'S NOT CASH ON DELIVERY
  if (!COD) return res.status(400).json({ message: ' cash on delivery failed' })

  try {
    //* GETTING THE LOGGED IN ADMIN
    const admin = await AdminModel.findById({ _id })

    //* GETTING THE LOGGED IN ADMIN CART
    const adminCart = await CartModel.findOne({ orderBy: admin._id })

    //* IF NOT CART...
    if (!adminCart)
      return res.status(404).json({ message: 'no cart available' })

    //* CALCULATE THE TOTAL AMOUNTS
    let totalAmount = 0
    if (couponApplied && adminCart.totalAfterDiscount) {
      totalAmount = admin.totalAfterDiscount
    } else {
      totalAmount = admin.CartTotal
    }

    //* CREATE NEW ORDER
    const newOrder = await OrderModel.create({
      products: adminCart.products,
      paymentIntent: {
        id: uniqid(),
        status: 'Not Processed',
        currency: 'usd',
        createdAt: Date.now(),
      },
      orderBy: admin._id,
    })

    //* UPDATE THE PRODUCT COUNT IN STOCK AND SOLD
    const update = adminCart.products.map((item) => {
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
  //* GETTING LOGGED IN ADMIN
  const { _id } = req.admin

  try {
    //* FIND THE LOGGED  IN ADMIN
    const admin = await AdminModel.findOne({ _id })

    //* FIND THE ADMIN ORDER
    const findOrder = await OrderModel.findOne({ orderBy: admin._id })

    //* IF ORDER ISN'T FOUND
    if (!findOrder) return res.status(404).json({ message: 'no orders placed' })

    //* SEND THE ORDERS TO THE ADMIN
    res.status(200).json({ orders: findOrder })
  } catch (error) {
    console.log({ error })
  }
}

//* GET ACTIVE ADMINS
module.exports.getActiveAdmins = async (req, res) => {
  //* GETTING ALL ACTIVE  ADMINS
  const Admins = await AdminModel.find({ active: true }).select(
    'email isBlocked mobile country active'
  )

  //* IF NO ACTIVE ADMINS ....
  if (!Admins) return res.status(404).json({ message: 'no active admins' })

  //* SEND A SUCCESS RESPONSE
  res.status(200).json({ active: Admins })
}

//* GET OFFLINE ADMINS
module.exports.getOfflineAdmins = async (req, res) => {
  //* GETTING ALL OFFLINE ADMINS
  const Admins = await AdminModel.find({ active: false }).select(
    'email isBlocked mobile country active'
  )

  //* IF NO OFFLINE ADMINS
  if (!Admins) return res.status(404).json({ message: 'no offline admins' })

  //* SEND A SUCCESS RESPONSE
  res.status(200).json({ offline: Admins })
}

//* GET ACTIVE  ADMINS COUNTS
module.exports.getActiveAdminsCounts = async (req, res) => {
  //* GETTING ALL ACTIVE ADMINS COUNTS
  const activeCount = await AdminModel.countDocuments({ active: true })

  //* IF NO ACTIVE ADMINS....
  if (!activeCount) return res.status(404).json({ active_Admins: 0 })

  //* SEND A SUCCESS RESPONSE
  res.status(200).json({ active_Admins: activeCount })
}

//* GET OFFLINE  ADMINS COUNTS
module.exports.getOfflineAdminsCounts = async (req, res) => {
  //* GETTING ALL OFFLINE ADMINS
  const offlineCount = await AdminModel.countDocuments({ active: false })

  //* IF NO OFFLINE ADMINS
  if (!offlineCount) return res.status(404).json({ offline: 0 })

  //* SEND A SUCCESS RESPONSE
  res.status(200).json({ offline_Admins: offlineCount })
}
