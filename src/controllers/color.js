//* COLOR CONTROLLER
const ColorModel = require('../model/color')
const mongoose = require('mongoose')
const { ColorSchemaValidation } = require('../Validations/schema/color')

//* COLOR END POINTS

//* GET ALL COLOR
module.exports.get = async (req, res) => {
  try {
    //* CREATE A QUERY OPTION
    const options = {
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 10,
      sort: { createdAT: -1 },
    }

    //* CREATE A QUERY SEARCH BAR
    const search = req.query.search
    const query = search ? { title: { $regex: search, $options: 'i' } } : {}
    const result = await ColorModel.paginate(query, options)

    //* IF RESULT HAS NEXT PAGE
    const nextPage = result.hasNextPage
      ? `${req.baseUrl}?page=${result.nextPage}`
      : null

    //* IF RESULT HAS PREV PAGE
    const prevPage = result.hasPrevPage
      ? `${req.baseUrl}?page=${result.prevPage}`
      : null

    //* SEND A SUCCESS RESPONSE TO THE CLIENT
    return res
      .status(200)
      .json({ colors: result.docs, nextPage: nextPage, prevPage: prevPage })
  } catch (error) {
    return res.status(500).json({ status: ' internet error' })
  }
}

//* GET COLORS COUNTS
module.exports.getColorsCounts = async (req, res) => {
  //* GET COUNTS
  const counts = await ColorModel.countDocuments()

  //* IF THERE'S NOT COLOR
  if (!counts) {
    res.status(404).json({ colors: 0 })
  } else {
    //* SEND ALL COLORS COUNTS TO THE CLIENT
    return res.status(200).send({ colors: counts })
  }
}

//* GET COLORS BY ID
module.exports.getColorById = async (req, res) => {
  //* CHECKING IF ITS A VALID
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json('invalid color id')

  //* FIND THE COLOR BY ID
  const Color = await ColorModel.findById({ _id: req.params.id }).sort({
    createdAT: -1,
  })

  //* IF THE COLOR IS NOT FOUND
  if (!Color) {
    return res.status(404).json({ message: 'Color not found' })
  } else {
    //* SEND THE COLOR TO THE CLIENT
    return res.status(200).send({ Color: Color })
  }
}

//* CREATE COLOR
module.exports.post = async (req, res) => {
  //*  VALIDATING THE SCHEMA
  const { error } = ColorSchemaValidation(req.body)
  if (error) return res.status(422).json(error.details[0].message)

  //* DETAILS IN THE BODY
  const { title } = req.body

  //* CHECK IF THE COLOR EXISTS BEFORE CREATING
  const colorExist = await ColorModel.findOne({ title })

  //* IF EXISTS
  if (colorExist)
    return res.status(400).json({ message: 'Color already exists' })

  //* CREATE NEW Color
  const Color = new ColorModel({ title })

  //* SAVE THE CATEGORY TO THE DATA BASE
  await Color.save()

  //* IF ITS NOT CREATED
  if (!Color) {
    return res
      .status(500)
      .json({ message: ' internet error , Color not created' })
  } else {
    //* SEND THE CREATED COLOR TO THE CLIENT
    return res.status(201).json({ created: Color })
  }
}

//* UPDATE COLOR BY ID
module.exports.put = async (req, res) => {
  //* VALIDATE CATEGORY SCHEMA
  const { error } = ColorSchemaValidation(req.body)
  if (error) return res.status(422).json(error.details[0].message)

  //* CHECKING IF ITS A VALID COLOR ID
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ error: 'invalid Color id' })

  //* UPDATING THE COLOR
  const updateColor = await ColorModel.findByIdAndUpdate(
    { _id: req.params.id },
    req.body,
    { new: true }
  )

  //* IF ITS NOT UPDATED
  if (!updateColor) {
    return res
      .status(500)
      .json({ message: 'internet error , Color not updated' })
  } else {
    //* SEND THE UPDATED COLOR TO THE CLIENT
    return res.status(200).send({ updated: updateColor })
  }
}

//* DELETE COLOR BY ID
module.exports.delete = async (req, res) => {
  //* CHECKING IF ITS A VALID Color ID
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ error: 'invalid Color id' })

  //* DELETING THE COLOR
  const delColor = await ColorModel.findByIdAndDelete({
    _id: req.params.id,
  })

  //* IF ITS NOT DELETED
  if (!delColor) {
    return res
      .status(500)
      .json({ status: 'internet error ', message: 'Color not deleted' })
  } else {
    //* SEND A SUCCESS RESPOND TO THE CLIENT
    return res.status(200).json({ success: true, message: 'deleted Color' })
  }
}
