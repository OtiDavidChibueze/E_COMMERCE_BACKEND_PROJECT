//* PRODUCT MODEL
const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const Schema = mongoose.Schema

const ProductSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      required: true,
    },
    brand: {
      type: String,
      ref: 'Brand',
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    countInStock: {
      type: Number,
      required: true,
      default: 0,
    },
    sold: {
      type: Number,
      min: 0,
      default: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    images: [],
    color: [],
    tags: [],
    category: {
      type: String,
      ref: 'Category',
      required: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    numberReviews: {
      type: Number,
      default: 0,
    },
    Like: {
      type: Boolean,
      default: false,
    },
    DisLike: {
      type: Boolean,
      default: false,
    },
    LikedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    DisLikedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    ratings: [
      {
        comment: {
          type: String,
        },
        star: {
          type: Number,
        },
        postedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    totalRating: {
      type: String,
      default: 0,
    },
  },
  { timestamps: true }
)

ProductSchema.plugin(mongoosePaginate)

const ProductModel = mongoose.model('Product', ProductSchema)

module.exports = ProductModel
