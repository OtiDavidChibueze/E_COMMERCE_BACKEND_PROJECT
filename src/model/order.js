//* ORDER MODEL
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const OrderSchema = new Schema({
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
      count: Number,
      color: String,
    },
  ],
  paymentIntent: {},
  orderStatus: {
    type: String,
    default: 'Not Processed',
  },
  enum: [
    'Not Processed',
    'Cash on Delivery',
    'Processing',
    'Dispatched',
    'Cancelled',
    'Delivered',
  ],

  orderBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
})

const OrderModel = mongoose.model('Order', OrderSchema)

module.exports = OrderModel
