//* COLOR MODEL
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongoosePaginate = require('mongoose-paginate-v2')

const ColorSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
)

//* PLUGIN PAGINATE
ColorSchema.plugin(mongoosePaginate)

//* CREATE COLOR MODEL
const ColorModel = mongoose.model('Color', ColorSchema)

//* EXPORT COLOR MODEL
module.exports = ColorModel
