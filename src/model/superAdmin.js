//* SUPER ADMIN MODEL
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const mongoosePaginate = require('mongoose-paginate-v2')

const SuperAdminSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      min: 6,
      max: 20,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
    },
    country: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    zipCode: {
      type: String,
      required: true,
    },
    street: {
      type: String,
      required: true,
    },
    homeAddress: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'Admin',
    },
    active: {
      type: Boolean,
      default: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
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

//* HASH PASSWORD BEFORE SAVING TO THE DATABASE
SuperAdminSchema.pre('save', async function (next) {
  //* CHECKING IF THE PASSWORD ISN'T MODIFIED
  if (!this.isModified('password')) {
    return next()
  }
  const salt = await bcrypt.genSalt()
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

//* COMPARE OLD PASSWORD BEFORE CHANGE
SuperAdminSchema.methods.comparePassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password)
  } catch (error) {
    console.log(error)
    return false
  }
}

//* CREATE PASSWORD RESET TOKEN
SuperAdminSchema.methods.createPasswordResetToken = async function () {
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
SuperAdminSchema.plugin(mongoosePaginate)

//* CREATE A MODEL
const SuperAdminModel = mongoose.model('SuperAdmin', SuperAdminSchema)

//* EXPORT THE MODEL
module.exports = SuperAdminModel
