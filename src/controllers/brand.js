//* BRAND CONTROLLER
const BrandModel = require('../model/brand')
const mongoose = require('mongoose')
const { brandSchemaValidation } = require('../Validations/schema/brand')

//* BRAND END POINTS

//* GET ALL BRANDS
module.exports.get = async (req, res) => {
  const getAllBrands = await BrandModel.find()
    .sort({
      createdAt: -1,
    })
    .select('-_id title icon color')

  //* IF NO BRANDS
  if (!getAllBrands) {
    res.status(404).json({ message: 'no available brand' })
  } else {
    //* SEND ALL BRANDS TO THE CLIENT
    res.status(200).json({ brands: getAllBrands })
  }
}

//* GET BRAND COUNTS
module.exports.getBrandCounts = async (req, res) => {
  //* GET COUNTS
  const counts = await BrandModel.countDocuments()

  //* IF THERE'S NOT BRAND
  if (!counts) {
    res.status(404).json({ message: 'no brand available' })
  } else {
    //* SEND ALL BRANDS COUNTS TO THE CLIENT
    return res.status(200).send({ brands: counts })
  }
}

//* GET BRAND BY ID
module.exports.getBrandById = async (req, res) => {
  //* CHECKING IF ITS A VALID
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json('invalid id')

  //* FIND THE BRAND BY ID
  const brand = await BrandModel.findById({ _id: req.params.id })
    .select('-_id title icon color')
    .sort({
      createdAT: -1,
    })

  //* IF THE BRAND IS NOT FOUND
  if (!brand) {
    return res.status(404).json({ message: 'brand not found' })
  } else {
    //* SEND THE BRAND TO THE CLIENT
    return res.status(200).send({ brand: brand })
  }
}

//* CREATE BRAND
module.exports.post = async (req, res) => {
  //*  VALIDATING THE SCHEMA
  const { error } = brandSchemaValidation(req.body)
  if (error) return res.status(422).json(error.details[0].message)

  //* DETAILS IN THE BODY
  const { title, icon, color } = req.body

  //* CHECK IF THE BRAND EXISTS BEFORE CREATING
  const categoryExist = await BrandModel.findOne({ title })

  //* IF EXISTS
  if (categoryExist)
    return res.status(400).json({ message: 'brand already exists' })

  //* CREATE NEW BRAND
  const brand = new BrandModel({ title, icon, color })

  //* SAVE THE CATEGORY TO THE DATA BASE
  await brand.save()

  //* IF ITS NOT CREATED
  if (!brand) {
    return res
      .status(500)
      .json({ message: ' internet error , brand not created' })
  } else {
    //* SEND THE CREATED BRAND TO THE CLIENT
    return res.status(201).json({ created: brand })
  }
}

//* UPDATE BRAND BY ID
module.exports.put = async (req, res) => {
  //* VALIDATE CATEGORY SCHEMA
  const { error } = brandSchemaValidation(req.body)
  if (error) return res.status(422).json(error.details[0].message)

  //* CHECKING IF ITS A VALID BRAND ID
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ error: 'invalid brand id' })

  //* UPDATING THE BRAND
  const updateBrand = await BrandModel.findByIdAndUpdate(
    { _id: req.params.id },
    req.body,
    { new: true }
  )

  //* IF ITS NOT UPDATED
  if (!updateBrand) {
    return res
      .status(500)
      .json({ message: 'internet error , brand not updated' })
  } else {
    //* SEND THE UPDATED BRAND TO THE CLIENT
    return res.status(200).send({ updated: updateBrand })
  }
}

//* DELETE BRAND BY ID
module.exports.delete = async (req, res) => {
  //* CHECKING IF ITS A VALID BRAND ID
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ error: 'invalid brand id' })

  //* DELETING THE BRAND
  const delBrand = await BrandModel.findByIdAndDelete({
    _id: req.params.id,
  })

  //* IF ITS NOT DELETED
  if (!delBrand) {
    return res.status(500).json('brand not deleted')
  } else {
    //* SEND A SUCCESS RESPOND TO THE CLIENT
    return res.status(200).json({ success: true, message: 'deleted brand' })
  }
}
