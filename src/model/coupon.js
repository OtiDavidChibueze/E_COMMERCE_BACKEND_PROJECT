const mongoose = require('mongoose') // Erase if already required

// Declare the Schema of the Mongo model
var couponSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  expiry: {
    type: Date,
  },
  discount: {
    type: Number,
    required: true,
  },
})

//Export the model
const CouponModel = mongoose.model('Coupon', couponSchema)

module.exports = CouponModel
