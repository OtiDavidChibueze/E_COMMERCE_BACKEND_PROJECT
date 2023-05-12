//* BRAND MODEL
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const BrandSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    icon: {
      type: String,
      default: 'icon',
    },
    color: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Color',
    },
  },
  { timestamps: true }
)

const BrandModel = mongoose.model('Brand', BrandSchema)

module.exports = BrandModel
