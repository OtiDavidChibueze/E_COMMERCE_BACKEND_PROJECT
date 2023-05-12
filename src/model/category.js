//* CATEGORY MODEL
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongoosePaginate = require('mongoose-paginate-v2')

const CategorySchema = new Schema(
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

CategorySchema.plugin(mongoosePaginate)

const CategoryModel = mongoose.model('Category', CategorySchema)

module.exports = CategoryModel
