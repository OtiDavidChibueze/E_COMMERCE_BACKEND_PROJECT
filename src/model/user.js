//* USER MODEL
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const mongoosePaginate = require('mongoose-paginate-v2')

//* CREATING USER SCHEMA
const UserSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
      min: 11,
    },
    country: {
      type: String,
    },
    role: {
      type: String,
      default: 'user',
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    cart: [
      {
        type: String,
      },
    ],
    shippingAddress: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
      },
    ],
    wishList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    passwordChangedAT: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
)

//* HASH A USER PASSWORD BEFORE SAVING THE USER
UserSchema.pre('save', async function (next) {
  //* CHECKING IF THE PASSWORD IS NOT MODIFIED
  if (!this.isModified('password')) {
    next()
  }
  //* GENERATE SALT
  const salt = await bcrypt.genSalt()
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

//* COMPARE OLD PASSWORD BEFORE CHANGING
UserSchema.methods.comparePassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password)
  } catch (error) {
    console.log(error)
    return false
  }
}

//* PASSWORD RESET TOKEN
UserSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString('hex')
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')
  this.passwordResetExpiresAt = Date.now() + 10 * 60 * 1000 //* set expiration to 10 minutes
  await this.save()
  return resetToken
}

//* PLUGIN MONGOOSE PAGINATE
UserSchema.plugin(mongoosePaginate)

//* CREATE A MODEL
const UserModel = mongoose.model('User', UserSchema)

//* EXPORT THE MODEL
module.exports = UserModel
