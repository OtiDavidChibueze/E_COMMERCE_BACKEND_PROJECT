//* USER CONTROLLER
const UserModel = require('../model/user')
const ProductModel = require('../model/product')
const CartModel = require('../model/cart')

const jwt = require('jsonwebtoken')
const { maxAge, createToken } = require('../jwt/createToken')

const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const uniqid = require('uniqid')

const {
  userRegisterSchemaValidation,
  userUpdateSchemaValidation,
  resetAndChangePasswordValidation,
  forgottenPassword,
} = require('../Validations/schema/user')

const keys = require('../config/keys')
const sendEmail = require('./nodeMailer')
const CouponModel = require('../model/coupon')
const OrderModel = require('../model/order')

//*  USER END POINTS

//* GET ALL USERS
module.exports.get_All_Users_And_Also_Search_Users_With_Emails = async (
  req,
  res
) => {
  //* ONLY ADMINS CAN GET ALL USERS
  if (req?.user?.role !== 'admin')
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
  //* ONLY ADMINS CAN GET ALL USERS BY ID
  if (req?.user?.role !== 'admin')
    return res.status(401).json({ message: 'unauthorized' })

  try {
    //* GETTING THE DETAILS IN THE PARAMS
    const { userId } = req.params

    //* CHECKING IF ITS A VALID USER ID
    if (!mongoose.isValidObjectId(req.params.userId))
      return res.status(400).json({ error: 'invalid user id' })

    //* GETTING THE USER
    const getUser = await UserModel.findById(userId)
      .select('-password')
      .populate({ path: 'wishList', select: 'title price -_id countInStock' })

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
  //* ONLY ADMINS CAN GET ALL USERS COUNTS
  if (req?.user?.role !== 'admin')
    return res.status(401).json({ message: 'unauthorized' })

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
    const { email, userName, password, mobile, country, address } = req.body

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
      address,
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
      const token = createToken(newUser.id)
      res.cookie('user', token, { maxAge: maxAge * 1000, httpOnly: true })
      //* SEND A SUCCESS RESPONSE TO THE CLIENT AND THE USER IS LOGGED IN IMMEDIATELY
      return res.status(201).json({ registered: newUser })
    }
  } catch (error) {
    console.log(error)
  }
}

//* UPDATE USER
module.exports.updateUser = async (req, res) => {
  //* ONLY LOGGED IN USERS CAN UPDATE THEIR INFO
  if (req?.user?.role !== 'user')
    return res.status(401).json({ message: 'unauthorized' })

  //* VALIDATING THE DETAILS IN THE BODY
  const { error } = userUpdateSchemaValidation(req.body)
  if (error) return res.status(400).json(error.details[0].message)

  //* GETTING THE LOGGED IN USER ID
  const { _id } = req.user

  //* ACCESSING THE DETAILS IN THE BODY
  const { userName, mobile, country, address } = req.body

  try {
    //* GET THE USER AND UPDATE....
    //! ONLY LOGGED IN USER CAN UPDATE THEIR SELF
    const user = await UserModel.findByIdAndUpdate(
      { _id },
      {
        userName: userName,
        mobile: mobile,
        country: country,
        address: address,
      },
      { new: true }
    )

    //* IF ERROR OCCURS DURING THE UPDATE ...
    if (!user)
      return res
        .status(500)
        .json({ status: 'internet error', message: 'not updated ' })

    //* SEND A SUCCESS RESPONSE TO THE CLIENT
    res.status(200).json({ updated: user })
  } catch (error) {
    console.log({ error })
  }
}

//* UPDATE USER BY ID
module.exports.put_update_user_By_Id = async (req, res) => {
  //* ONLY ADMINS CAN UPDATE USER BY ID
  if (req?.user?.role !== 'admin')
    return res.status(401).json({ message: 'unauthorized' })

  //* VALIDATING THE DETAILS IN THE BODY
  const { error } = userUpdateSchemaValidation(req.body)
  if (error) return res.status(400).json(error.details[0].message)

  //* GETTING THE USER ID IN THE PARAMS
  const { userId } = req.params

  //* CHECKING IF THE USER ID IS VALID
  if (!mongoose.isValidObjectId(req.params.userId))
    return res.status(400).json({ error: 'invalid user id' })

  //* GETTING THE DETAILS IN THE BODY
  const { userName, country, mobile, address } = req.body

  //* CHECKING IF MOBILE NUMBER EXIST BEFORE UPDATING....
  const mobileExists = await UserModel.findOne({ mobile })

  //* IF EXISTS ....
  if (mobileExists)
    return res
      .status(406)
      .json({ status: 'not accepted', message: 'mobile already exists' })

  try {
    //* UPDATE THE USER
    const updateUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        userName: userName,
        country: country,
        mobile: mobile,
        address: address,
      },
      {
        new: true,
      }
    ).select('-password')

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
      //* IF PASSWORD CORRECT UPDATE THE ACTIVE STATUS
      await UserModel.findOneAndUpdate(
        { email },
        {
          active: true,
        },
        {
          new: true,
        }
      )
      //* CREATE A LOGIN TOKEN FOR THE USER
      const Token = jwt.sign(
        {
          userId: user.id,
          role: user.role,
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
      res.status(200).json({ logged_in: user.email, message: 'access granted' })
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

//* LOG OUT USER
module.exports.post_logOut = async (req, res) => {
  //* ONLY LOGGED IN USER CAN LOG OUT
  if (req?.user?.role !== 'admin')
    return res.status(401).json({ message: 'unauthorized' })

  //* GETTING THE ID OF THE LOGGED IN USER
  const loggedInUserId = req.user._id

  //* FIND THE USER AND UPDATE THE ACTIVE STATUS
  const findUser = await UserModel.findByIdAndUpdate(
    loggedInUserId,
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
    message: 'user logged out',
    active: findUser.active,
  })
}

//* BLOCK A USER
module.exports.blockUserById = async (req, res) => {
  //* ONLY ADMINS CAN BLOCK USER
  if (req?.user?.role !== 'admin')
    return res.status(401).json({ message: 'unauthorized' })

  //* CHECKING IF ID IS VALID
  if (!mongoose.isValidObjectId(req.params.userId))
    return res
      .status(404)
      .json({ status: 'not found', message: 'no user with such id found' })

  //* GETTING THE USER ID IN THE PARAMS
  const { userId } = req.params

  try {
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

//* UNBLOCK USER
module.exports.unBlockUserById = async (req, res) => {
  //* ONLY ADMINS CAN UNBLOCK
  if (req?.user?.role !== 'admin')
    return res.status(401).json({ message: 'unauthorized' })

  //* CHECKING IF ID IS VALID
  if (!mongoose.isValidObjectId(req.params.userId))
    return res.status(404).json({
      status: 'not found',
      message: 'no such user with that id  found',
    })

  //* GETTING THE USER ID THE PARAMS
  const { userId } = req.params

  try {
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
  //* ONLY LOGGED IN USERS CAN CHANGE PASSWORD
  if (req?.user?.role !== 'admin')
    return res.status(401).json({ message: 'unauthorized' })

  //* VALIDATING THE USERS DETAILS IN THE BODY
  const { error } = resetAndChangePasswordValidation(req.body)
  //* IF ERROR OCCURS
  if (error)
    return res
      .status(422)
      .json({ status: 'unprocessed entity', error: error.details[0].message })

  //* GETTING THE DETAILS IN THE BODY
  const { oldPassword, newPassword } = req.body

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

    //* SEND A SUCCESS RESPONSE TO THE CLIENT
    return res
      .status(200)
      .json({ user: user.email, message: 'password updated' })
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
    //* GETTING THE USER WITH THE PROVIDED EMAIL
    const user = await UserModel.findOne({ email })

    //* IF USER ISN'T FOUND
    if (!user) {
      return res.status(404).json({ message: 'no user with this email found' })
    } else {
      //* SEND A RESET EMAIL LINK TO THE USER AND RESET USER PASSWORD
      const resetToken = await user.createPasswordResetToken()

      //* SEND A RESET LINK
      const resetUrl = `Hi , please clink the link to reset your password , link is only valid for 10min <a href = 'http://localhost:4000/api/eshop/user/resetToken/${resetToken}'>click here</a>`

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
  //* ONLY ADMINS CAN DELETE USER BY ID
  if (req?.user?.role !== 'admin')
    return res.status(401).json({ message: 'unauthorized' })

  //* CHECKING IF ITS A VALID USER ID
  if (!mongoose.isValidObjectId(req.params.userId))
    return res.status(400).json({ error: 'invalid user id' })

  //* GETTING THE USER ID IN THE PARAMS
  const { userId } = req.params

  try {
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

//* ADD PRODUCT TO WISHLIST
module.exports.addToWishList = async (req, res) => {
  //* ONLY LOGGED IN USERS CAN ADD PRODUCT TO WISHLIST
  if (req?.user?.role !== 'user')
    return res.status(401).json({ message: 'unauthorized' })

  //* ACCESSING THE DETAILS IN THE BODY
  const { productId } = req.body

  //* GETTING THE LOGGED IN USER ID
  const loggedInUserId = req.user._id

  try {
    const product = await ProductModel.findById(productId)

    if (!product) return res.status(404).json({ message: 'product not found' })

    //* GET THE USER ID
    const user = await UserModel.findById(loggedInUserId)

    //* CHECK IF THE PRODUCT HAS BEEN ADDED TO WISHLIST
    const alreadyAdded = user.wishList.find(
      (id) => id.toString() === productId.toString()
    )

    //* CLICK THE SEND BUTTON TO ADD THE PRODUCT OR DOUBLE CLICK THE SEND BUTTON TO REMOVE THE PRODUCT
    if (alreadyAdded) {
      //* UPDATE THE USER WISHLIST
      user.wishList.pull(productId)

      //* SAVE THE USER
      await user.save(product)

      //* SEND A RESPONSE TO THE CLIENT
      return res.status(200).json({ user })
    } else {
      //* ADD THE PRODUCT TO WISH LIST
      user.wishList.push(productId)

      //* SAVE THE USER
      await user.save(product)

      //* SEND A RESPONSE TO THE CLIENT
      return res.status(200).json({ user })
    }
  } catch (error) {
    console.log(error)
  }
}

//* GET USER WISHLIST
module.exports.getWishList = async (req, res) => {
  //* ONLY LOGGED IN USER CAN GET THEIR WISHLIST
  if (req?.user?.role !== 'admin')
    return res.status(401).json({ message: 'unauthorized' })
  //* GETTING THE LOGGED IN USER ID
  const loggedInUserId = req.user._id

  try {
    //* FIND THE USER WITH THE ID
    const user = await UserModel.findById(loggedInUserId)
      .populate({
        path: 'wishList',
        populate: { path: 'category', select: 'title -_id' },
      })
      .populate({
        path: 'wishList',
        populate: { path: 'brand', select: 'title -_id' },
      })

    //* IF USER EXISTS
    if (!user) return res.status(404).json({ message: 'user is not found' })

    //* SEND A SUCCESS RESPONSE TO THE CLIENT
    res.status(200).json({ wishList: user.wishList })
  } catch (err) {
    console.log({ error: err })
  }
}

//* ADD ADDRESS
module.exports.add_Address = async (req, res) => {
  //* ONLY LOGGED IN USER CAN ADD ADDRESS
  if (req?.user?.role !== 'user')
    return res.status(401).json({ message: 'unauthorized' })

  //* GET THE LOGGED IN USER ID
  const loggedInUserId = req.user._id

  //* GETTING THE DETAILS IN THE BODY
  const { address } = req.body

  try {
    //* FIND THE USER AND UPDATE
    const user = await UserModel.findByIdAndUpdate(
      loggedInUserId,
      {
        address: address,
      },
      {
        new: true,
      }
    )

    //* IF USER ISN'T FOUND
    if (!user)
      return res
        .status(404)
        .json({ status: 'not found', message: 'user not found' })

    //* SEND A SUCCESS RESPONSE TO THE USER
    res.status(200).json({
      status: 'success',
      message: 'new address added',
      address: user.address,
    })
  } catch (error) {
    console.log({ error: err })
  }
}

//* ADD TO CART
module.exports.addToCart = async (req, res) => {
  //* ONLY LOGGED IN USER CAN ADD TO CART
  if (req?.user?.role !== 'user')
    return res.status(401).json({ message: 'unauthorized' })

  //* GETTING THE DETAILS IN THE BODY
  const { cart } = req.body

  //* GETTING THE LOGGED IN USER ID
  const { _id } = req.user

  try {
    //* MAKING THE PRODUCTS AN EMPTY ARRAY
    let products = []

    //* FINDING THE LOGGED IN USER
    const user = await UserModel.findById({ _id })

    //* IF USER DON'T EXISTS  .....
    if (!user) return res.status(404).json({ message: ' user not found' })

    //* CHECKING IF THE USER  ALREADY HAS A CART
    const alreadyCart = await UserModel.findOne({ orderBy: user._id })

    //* IF YES ... REMOVE THE USER CART
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
      orderBy: user._id,
    }).populate({ path: 'products.product', select: 'title' })

    //* SAVE THE CHANGES
    await newCart.save()

    //* SEND A SUCCESS RESPONSE TO THE CLIENT
    res.status(200).json({ cart: newCart })
  } catch (error) {
    console.log({ error })
  }
}

//* GET USER CART
module.exports.getUserCart = async (req, res) => {
  //* ONLY LOGGED IN USER CAN GET THEIR CART LIST
  if (req?.user?.role !== 'user')
    return res.status(401).json({ message: 'unauthorized' })

  //*  GET THE LOGGED IN USER ID
  const { _id } = req.user

  try {
    //* FIND THE LOGGED IN USER
    const user = await UserModel.findOne({ _id })

    //* IF USER NOT FOUND
    if (!user) return res.status(404).json({ message: 'user not found' })

    //* GET THE LOGGED IN USER CART
    const getCart = await CartModel.findOne({ orderBy: user._id })

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
  //* ONLY LOGGED IN USERS CAN LOG OUT
  if (req?.user?.role !== 'user')
    return res.status(401).json({ message: 'unauthorized' })
  //* GETTING THE LOGGED IN USER ID
  const { _id } = req.user

  try {
    //* FIND THE LOGGED IN USER
    const user = await UserModel.findOne({ _id })

    //* GET THE LOGGED IN USER CART AND REMOVE
    const cart = await CartModel.findOneAndRemove({ orderBy: user._id })

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
  //* ONLY LOGGED IN USERS CAN APPLY DISCOUNT TO CART
  if (req?.user?.role !== 'user')
    return res.status(401).json({ message: 'unauthorized' })

  //* GETTING THE LOGGED IN USER
  const { _id } = req.user

  //* ACCESS THE DETAILS IN THE BODY
  const { coupon } = req.body

  //* FIND THE LOGGED IN USER
  const user = await UserModel.findOne({ _id })

  //* GETTING THE COUPON
  const ValidCoupon = await CouponModel.findOne({ name: coupon })

  //* IF COUPON  DOESN'T EXIST
  if (!ValidCoupon)
    return res.status(404).json({ message: 'coupon not found or expired' })

  //* GET THE LOGGED IN USER CART
  const { CartTotal } = await CartModel.findOne({ orderBy: user._id }).populate(
    { path: 'products', populate: { path: 'product' } }
  )

  //* CALCULATE THE TOTAL AFTER DISCOUNT
  let totalAfterDiscount = (
    CartTotal -
    (CartTotal * ValidCoupon.discount) / 100
  ).toFixed(2)

  //* UPDATE THE TOTAL AFTER DISCOUNT PROPERTY IN THE CART
  await CartModel.findOneAndUpdate(
    { orderBy: user._id },
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
module.exports.orderItemsInCart = async (req, res) => {
  //* ONLY LOGGED IN USER CAN CREATE ORDER
  if (req?.user?.role !== 'user')
    return res.status(401).json({ message: 'unauthorized' })

  //* GETTING THE LOGGED IN USER  ID
  const { _id } = req.user

  //* ACCESSING THE DETAILS IN THE BODY
  const { COD, couponApplied } = req.body

  //* IF IT'S NOT CASH ON DELIVERY
  if (!COD) return res.status(400).json({ message: ' cash on delivery failed' })

  try {
    //* GETTING THE LOGGED IN USER
    const user = await UserModel.findById({ _id })

    //* GETTING THE LOGGED IN USER CART
    const userCart = await CartModel.findOne({ orderBy: user._id })

    //* IF NOT CART...
    if (!userCart) return res.status(404).json({ message: 'no cart available' })

    //* CALCULATE THE TOTAL AMOUNTS
    let totalAmount = 0
    if (couponApplied && userCart.totalAfterDiscount) {
      totalAmount = user.totalAfterDiscount
    } else {
      totalAmount = user.CartTotal
    }

    //* CREATE NEW ORDER
    const newOrder = await OrderModel.create({
      products: userCart.products,
      paymentIntent: {
        id: uniqid(),
        status: 'Not Processed',
        currency: 'usd',
        createdAt: Date.now(),
      },
      orderBy: user._id,
    })

    //* UPDATE THE PRODUCT COUNT_IN_STOCK AND SOLD
    const update = userCart.products.map((item) => {
      return {
        updateOne: {
          filter: { _id: item.product._id },
          update: {
            $inc: {
              countInStock: -item.count,
              sold: +item.count,
            },
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
module.exports.getOrderedItems = async (req, res) => {
  //* ONLY LOGGED IN USER CAN GET THEIR ORDER LIST
  if (req?.user?.role !== 'user')
    return res.status(401).json({ message: 'unauthorized' })

  //* GETTING LOGGED IN USER
  const { _id } = req.user

  try {
    //* FIND THE LOGGED  IN USER
    const user = await UserModel.findOne({ _id })

    //* FIND THE USER ORDER
    const findOrder = await OrderModel.findOne({ orderBy: user._id })
      .populate({
        path: 'products.product',
        select: ' -_id title count',
      })
      .populate({ path: 'orderBy', select: 'userName' })

    //* IF ORDER ISN'T FOUND
    if (!findOrder) return res.status(404).json({ message: 'no orders placed' })

    //* SEND THE ORDERS TO THE USER
    res.status(200).json({ orders: findOrder })
  } catch (error) {
    console.log({ error })
  }
}

//* GET ACTIVE  USERS COUNTS
module.exports.getActiveUsersCounts = async (req, res) => {
  //* ONLY LOGGED IN ADMINS CAN GET ALL ACTIVE USERS COUNTS
  if (req?.user?.role !== 'admin')
    return res.status(401).json({ message: 'unauthorized' })

  //* GETTING ALL ACTIVE USER COUNTS
  const activeCount = await UserModel.countDocuments({ active: true })

  //* IF NO ACTIVE ADMINS....
  if (!activeCount) return res.status(404).json({ active_Admins: 0 })

  //* SEND A SUCCESS RESPONSE
  res.status(200).json({ active_Users: activeCount })
}

//* GET OFFLINE  USERS COUNTS
module.exports.getOfflineUsersCounts = async (req, res) => {
  //* ONLY LOGGED IN ADMINS CAN GET ALL OFFLINE USERS COUNTS
  if (req?.user?.role !== 'admin')
    return res.status(401).json({ message: 'unauthorized' })

  //* GETTING ALL OFFLINE ADMINS
  const offlineCount = await AdminModel.countDocuments({ active: false })

  //* IF NO OFFLINE USER
  if (!offlineCount) return res.status(404).json({ offline: 0 })

  //* SEND A SUCCESS RESPONSE
  res.status(200).json({ offline_Users: offlineCount })
}
