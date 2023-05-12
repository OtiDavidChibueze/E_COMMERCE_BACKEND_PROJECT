//* ADMIN MODEL
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const mongoosePaginate = require('mongoose-paginate-v2')

//* CREATING ADMIN SCHEMA
const AdminSchema = new Schema(
  {
    adminName: {
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
    address: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'admin',
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
    wishList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
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

//* HASH A ADMIN PASSWORD BEFORE SAVING THE ADMIN
AdminSchema.pre('save', async function (next) {
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
AdminSchema.methods.comparePassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password)
  } catch (error) {
    console.log(error)
    return false
  }
}

//* PASSWORD RESET TOKEN
AdminSchema.methods.createPasswordResetToken = async function () {
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
AdminSchema.plugin(mongoosePaginate)

//* CREATE A MODEL
const AdminModel = mongoose.model('Admin', AdminSchema)

//* EXPORT THE MODEL
module.exports = AdminModel
