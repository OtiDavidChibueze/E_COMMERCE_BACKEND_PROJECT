//* CATEGORY CONTROLLER
const CategoryModel = require('../model/category')
const mongoose = require('mongoose')
const { categorySchemaValidation } = require('../Validations/schema/category')

//* CATEGORY END POINTS

//* GET ALL CATEGORY
module.exports.get = async (req, res) => {
  try {
    const options = {
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 5,
      sort: { createdAt: -1 },
    }

    //* ADDING A SEARCH BAR TO THE QUERY
    const search = req.query.search

    //* LOOKING FOR THE SEARCHED ITEM AND ADDING AN IF STATEMENT
    const query = search ? { title: { $regex: search, $options: 'i' } } : {}
    const result = await CategoryModel.paginate(query, options)

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

//* GET CATEGORY COUNT
module.exports.getCategoryCounts = async (req, res) => {
  //* GET COUNTS
  const counts = await CategoryModel.countDocuments()

  //* IF THERE'S NOT CATEGORY
  if (!counts) {
    res.status(404).json({ message: 'no category available' })
  } else {
    //* SEND ALL CATEGORY COUNTS TO THE CLIENT
    return res.status(200).send({ category: counts })
  }
}

//* GET CATEGORY BY ID
module.exports.getCategoryById = async (req, res) => {
  //* CHECKING IF ITS A VALID
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json('invalid id')

  //* FIND THE CATEGORY BY ID
  const category = await CategoryModel.findById({ _id: req.params.id })
    .select('-_id title icon color')
    .sort({
      createdAT: -1,
    })

  //* IF THE CATEGORY IS NOT FOUND
  if (!category) {
    return res.status(404).json({ message: 'category not found' })
  } else {
    //* SEND THE CATEGORY TO THE CLIENT
    return res.status(200).send({ category: category })
  }
}

//* CREATE CATEGORY
module.exports.post = async (req, res) => {
  //*  VALIDATING THE SCHEMA
  const { error } = categorySchemaValidation(req.body)
  if (error) return res.status(422).json(error.details[0].message)

  //* DETAILS IN THE BODY
  const { title, icon, color } = req.body

  //* CHECK IF THE CATEGORY EXISTS BEFORE CREATING
  const categoryExist = await CategoryModel.findOne({ title })

  if (categoryExist)
    return res.status(400).json({ message: 'category already exists' })

  const category = new CategoryModel({ title, icon, color })

  //* SAVE THE CATEGORY TO THE DATA BASE
  await category.save()

  //* IF ITS NOT CREATED
  if (!category) {
    return res
      .status(500)
      .json({ message: ' internet error , category not created' })
  } else {
    //* SEND THE CREATED CATEGORY TO THE CLIENT
    return res.status(201).json({ created: category })
  }
}

//* UPDATE CATEGORY BY ID
module.exports.put = async (req, res) => {
  //* VALIDATE CATEGORY SCHEMA
  const { error } = categorySchemaValidation(req.body)
  if (error) return res.status(422).json(error.details[0].message)

  //* CHECKING IF THE ID IS VALID
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ error: 'invalid category id' })

  //* UPDATING THE CATEGORY
  const updateCategory = await CategoryModel.findByIdAndUpdate(
    { _id: req.params.id },
    req.body,
    { new: true }
  )

  //* IF ITS NOT UPDATED
  if (!updateCategory) {
    return res
      .status(500)
      .json({ message: 'internet error , category not updated' })
  } else {
    //* SEND THE UPDATED CATEGORY TO THE CLIENT
    return res.status(200).send({ updated: updateCategory })
  }
}

//* DELETE CATEGORY BY ID
module.exports.delete = async (req, res) => {
  //* CHECKING IF ITS A VALID ID
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ error: 'invalid category id' })

  //* DELETING THE CATEGORY
  const delCategory = await CategoryModel.findByIdAndDelete({
    _id: req.params.id,
  })

  //* IF ITS NOT DELETED
  if (!delCategory) {
    return res.status(500).json('category not deleted')
  } else {
    //* SEND A SUCCESS RESPOND TO THE CLIENT
    return res.status(200).json({ success: true, message: 'deleted category' })
  }
}
