//* CART MODEL
const mongoose = require('mongoose')

//* Declare the Schema of the Mongo model
var CartSchema = new mongoose.Schema({
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
      count: { type: Number },
      color: { type: String },
      price: { type: Number },
    },
  ],
  CartTotal: Number,
  totalAfterDiscount: Number,
  orderBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
})

//* Export the model
module.exports = mongoose.model('Cart', CartSchema)
