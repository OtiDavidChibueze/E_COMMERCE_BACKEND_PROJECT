//* PRODUCT CONTROLLER
const ProductModel = require('../model/product')
const mongoose = require('mongoose')
const { productSchemaValidation } = require('../Validations/schema/product')
const slugify = require('slugify')
const CategoryModel = require('../model/category')
const BrandModel = require('../model/brand')
const { cloudinaryUploads, cloudinaryDelete } = require('../util/cloudinary')
const fs = require('fs')

//* PRODUCT END POINTS

//* GET ALL PRODUCTS
module.exports.get_products = async (req, res) => {
  try {
    //* CREATING A QUERY OPTIONS
    const options = {
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 5,
      sort: { createdAt: -1 },
    }

    //* ADDING A SEARCH BAR TO THE QUERY
    const search = req.query.search

    //* LOOKING FOR THE SEARCHED ITEM AND ADDING AN IF STATEMENT
    const query = search ? { title: { $regex: search, $options: 'i' } } : {}
    const result = await ProductModel.paginate(query, options)

    //* ADDING THE NEXT PAGE URL
    const nextPage = result.hasNextPage
      ? `${req.baseUrl}?page=${result.nextPage}`
      : null

    //* ADDING THE PREV PAGE URL
    const prevPage = result.hasPrevPage
      ? `${req.baseUrl}?page=${result.prevPage}`
      : null

    //* SENDING A SUCCESS RESPOND THE CLIENT
    return res.status(200).json({
      result: result.docs,
      nextPage: nextPage,
      prevPage: prevPage,
    })
  } catch (error) {
    return res.status(500).json({ error: error })
  }
}

//* GET PRODUCTS COUNTS
module.exports.get_products_count = async (req, res) => {
  const productCount = await ProductModel.countDocuments()
    .populate('category', 'name icon color -_id')
    .sort({ createdAt: -1 })

  if (productCount) {
    return res.status(200).json({ products: productCount })
  } else {
    return res.status(404).json({ message: 'no product available' })
  }
}

//* GET FEATURED PRODUCTS
module.exports.get_featured_products = async (req, res) => {
  const product = await ProductModel.find({ isFeatured: true })
    .select('-_id -createdAt -updatedAt')
    .populate('category', 'name icon color -_id')
    .sort({ ' productDate': -1 })

  if (product) {
    return res.status(200).json({ product: product })
  } else {
    return res.status(404).json({ message: 'no featured product available' })
  }
}

//* GET FEATURED PRODUCT COUNTS
module.exports.get_featured_products_count = async (req, res) => {
  const product = await ProductModel.find({ isFeatured: true })

  if (product) {
    return res.status(200).json({ featuredProduct: product })
  } else {
    return res.status(404).json({ message: 'no featured product available' })
  }
}

//* CREATE PRODUCT
module.exports.add_products = async (req, res) => {
  const { error } = productSchemaValidation(req.body)
  if (error) return res.status(400).json(error.details[0].message)

  //* SLUGIFY THE SLUG
  if (req.body.title) {
    req.body.slug = slugify(req.body.title)
  }

  //* CHECKING IF THE SLUG EXISTS BEFORE CREATING A PRODUCT
  const slugExists = await ProductModel.findOne({ slug: req.body.slug })
  if (slugExists)
    return res.status(400).json({ message: 'product slug already exists' })

  //* CHECKING IF THE BRAND EXISTS BEFORE CREATING A PRODUCT
  const brandExist = await BrandModel.findById({ _id: req.body.brand })
  if (!brandExist)
    return res.status(404).json({ message: 'no such brand with this id found' })

  //* CHECKING IF THE CATEGORY EXISTS BEFORE CREATING A PRODUCT
  const CategoryExist = await CategoryModel.findById({
    _id: req.body.categoryId,
  })
  if (CategoryExist)
    return res
      .status(404)
      .json({ message: 'no such category with this id found' })

  //* CREATING A NEW PRODUCT
  const product = new ProductModel(req.body)

  //* SAVE THE PRODUCT
  await product.save()

  //* IF ERROR OCCURS DURING CREATION...
  if (!product) {
    return res
      .status(500)
      .json({ created: false, message: 'product not created' })
  } else {
    //* SEND A SUCCESS RESPONSE TO THE CLIENT
    return res.status(201).json({ created: product })
  }
}

//* UPDATE PRODUCT BY ID
module.exports.edit_products = async (req, res) => {
  //* VALIDATING PRODUCT SCHEMA
  const { error } = productSchemaValidation(req.body)
  if (error) return res.status(422).send(error.details[0].message)

  //* CHECKING IF IT'S A VALID ID
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ error: 'invalid product id' })

  //* APPLYING SLUGIFY TO TITLE
  if (req.body.title) {
    req.body.slug = slugify(req.body.title)
  }

  //* UPDATE THE PRODUCT
  const updateProduct = await ProductModel.findByIdAndUpdate(
    { _id: req.params.id },
    req.body,
    { new: true }
  )

  //* IF ERROR OCCURS DURING UPDATE
  if (!updateProduct) {
    return res.status(500).json('product not updated ')
  } else {
    //* SEND A SUCCESS RESPONSE TO THE CLIENT
    return res.status(200).send({ updated: updateProduct })
  }
}

//* VIEW A PRODUCT BY ID
module.exports.getProductsByProductId = async (req, res) => {
  //* CHECK IF IT'S A VALID ID
  if (!mongoose.isValidObjectId(req.params))
    return res.status(400).json({ message: ' invalid product id' })

  try {
    //* FIND THE PRODUCT WITH THE GIVEN ID
    const product = await ProductModel.findById({ _id: req.params.productId })

    //* UPDATE THE NUMBER OF REVIEWS
    const updateNumReviews = await ProductModel.findByIdAndUpdate(
      { _id: req.params.productId },
      {
        $inc: { numberReviews: 1 },
      },
      {
        new: true,
      }
    )

    //* SEND A SUCCESS RESPONSE TO THE CLIENT
    res.status(200).json(updateNumReviews)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error })
  }
}

//* LIKE A PRODUCT
module.exports.likeAProduct = async (req, res) => {
  const { productId } = req.body
  const loggedInUserId = req.user._id

  try {
    //* FIND THE PRODUCT
    const product = await ProductModel.findById(productId)

    if (!product)
      return res.status(404).json({ message: 'product with that id not found' })

    //* CHECK IF THE PRODUCT WAS DISLIKED BEFORE
    productWasDisLiked = product.DisLikedUsers.includes(loggedInUserId)

    if (productWasDisLiked) {
      product.DisLikedUsers = product.DisLikedUsers.filter(
        (userId) => userId.toString() !== loggedInUserId
      )

      //* UPDATE THE PRODUCT
      product.DisLikedUsers.pull(loggedInUserId)
      product.DisLike = false

      await product.save()
      return res.status(200).json({ product })
    }

    //* CHECK IF THE PRODUCT WAS LIKED BEFORE
    productWasLiked = product.LikedUsers.includes(loggedInUserId)

    if (productWasLiked) {
      product.DisLikedUsers = product.LikedUsers.filter(
        (userId) => userId.toString() !== loggedInUserId
      )

      //* UPDATE THE PRODUCT
      product.LikedUsers.pull(loggedInUserId)
      product.Like = false

      //* SAVE THE PRODUCT
      await product.save()
      //* SEND THE SUCCESS PRODUCT TO THE CLIENT
      return res.status(200).json({ product })
    } else {
      //* IF THE PRODUCT HASN'T BEEN LIKED OR DISLIKED BEFORE THEN UPDATE THE PRODUCT
      product.LikedUsers.push(loggedInUserId)
      product.Like = true

      //* SAVE THE PRODUCT
      await product.save()
      //* SEND THE SUCCESS PRODUCT TO THE CLIENT
      return res.status(200).json({ product })
    }
  } catch (error) {
    console.log(error)
  }
}

//* DISLIKE A PRODUCT;
module.exports.disLikeAProduct = async (req, res) => {
  const { productId } = req.body
  const loggedInUserId = req.user._id

  try {
    //* FIND THE PRODUCT
    const product = await ProductModel.findById(productId)

    if (!product)
      return res.status(404).json({ message: 'product with that id not found' })

    //* CHECK IF THE PRODUCT WAS LIKED BEFORE
    productWasLiked = product.LikedUsers.includes(loggedInUserId)

    //* CLICK THE SEND BUTTON TO LIKE THE PRODUCT OR DOUBLE CLICK THE SEND BUTTON TO UNLIKE THE PRODUCT

    if (productWasLiked) {
      product.LikedUsers = product.LikedUsers.filter(
        (userId) => userId.toString() !== loggedInUserId
      )

      //* UPDATE THE PRODUCT
      product.LikedUsers.pull(loggedInUserId)
      product.Like = false

      await product.save()
      return res.status(200).json({ product })
    }

    //* CHECK IF THE PRODUCT WAS DISLIKED BEFORE
    productWasDisLiked = product.DisLikedUsers.includes(loggedInUserId)

    //* CLICK THE SEND BUTTON TO DISLIKE THE PRODUCT OR DOUBLE CLICK THE SEND BUTTON TO UN_DISLIKE THE PRODUCT
    if (productWasDisLiked) {
      product.DisLikedUsers = product.DisLikedUsers.filter(
        (userId) => userId.toString() !== loggedInUserId
      )

      //* UPDATE THE PRODUCT
      product.DisLikedUsers.pull(loggedInUserId)
      product.DisLike = false

      //* SAVE THE PRODUCT
      await product.save()
      //* SEND THE SUCCESS PRODUCT TO THE CLIENT
      return res.status(200).json({ product })
    } else {
      //* IF THE PRODUCT HASN'T BEEN LIKED OR DISLIKED BEFORE THEN UPDATE THE PRODUCT
      product.DisLikedUsers.push(loggedInUserId)
      product.DisLike = true

      //* SAVE THE PRODUCT
      await product.save()
      //* SEND THE SUCCESS PRODUCT TO THE CLIENT
      return res.status(200).json({ product })
    }
  } catch (error) {
    console.log(error)
  }
}

//* USER RATINGS TOWARD A PRODUCT
module.exports.rating = async (req, res) => {
  //* ACCESSING THE DETAILS IN THE BODY
  const { productId, comment, star } = req.body

  //* GETTING THE LOGGED IN USER ID
  const loggedInUserId = req.user._id

  try {
    //* FIND THE PRODUCT
    const product = await ProductModel.findById(productId)

    //* IF THE PRODUCT DOES NOT EXISTS
    if (!product) {
      return res
        .status(404)
        .json({ message: 'Product with the given ID not found' })
    }

    //* CHECK IF THE PRODUCT HAS BEEN RATED BEFORE
    const alreadyRated = product.ratings.find(
      (userId) => userId.postedBy.toString() === loggedInUserId.toString()
    )

    if (alreadyRated) {
      //* UPDATE EXISTING RATING
      alreadyRated.star = star
      alreadyRated.comment = comment
    } else {
      //* ADD NEW RATING
      product.ratings.push({
        star: star,
        comment: comment,
        postedBy: loggedInUserId,
      })
    }

    //* CALCULATE AND UPDATE PRODUCT TOTAL RATING
    let totalRating = 0

    for (let i = 0; i < product.ratings.length; i++) {
      totalRating += product.ratings[i].star
    }

    const Rating = Math.round(totalRating / product.ratings.length)

    product.totalRating = Rating

    //* SAVE THE PRODUCT
    await product.save()

    //* SEND A SUCCESS RESPONSE
    res.json({ product })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: 'Server Error' })
  }
}

//* DELETE A PRODUCT BY ID
module.exports.delete_products = async (req, res) => {
  //* GET THE PRODUCT ID IN THE PARAMS

  //* DELETE THE PRODUCT WITH THE GIVEN ID
  const delProduct = await ProductModel.findByIdAndDelete(productId)

  //* IF NOT DELETED
  if (!delProduct) return res.status(500).json({ message: 'internet error' })

  //* SEND A SUCCESS RESPOND TO THE CLIENT
  res.status(200).json({ status: 'success', message: 'deleted successfully' })
}

//* UPLOAD IMAGE BY PRODUCT ID
module.exports.uploadImages = async (req, res, next) => {
  //* GET THE PRODUCT ID

  try {
    const uploader = (path) => cloudinaryUploads(path, 'images')
    const urls = []
    const files = req.files

    for (const file of files) {
      const { path } = file
      const newPath = await uploader(path)
      urls.push(newPath)
      fs.unlinkSync(path)
    }

    const images = urls.map((file) => {
      return file
    })

    res.status(200).json({ message: 'image uploaded', images })
  } catch (error) {
    console.log(error)
  }
}

//* DELETE IMAGE BY PUBLIC ID
module.exports.deleteImages = async (req, res) => {
  //* ONLY ADMINS CAN  DELETE PHOTO
  if (req.user.role !== 'admin')
    return res.status(401).json({ message: 'unauthorized' })

  //* GET THE PUBLIC ID
  const { publicId } = req.params

  try {
    const deleted = cloudinaryDelete(publicId, 'images')

    res.status(200).json({ message: 'image deleted' })
  } catch (error) {
    console.log(error)
  }
}
