//* ENQUIRY CONTROLLER
const EnquiryModel = require('../model/enquiry')
const mongoose = require('mongoose')
const { EnquirySchemaValidation } = require('../Validations/schema/enquiry')

//* ENQUIRY END POINTS

//* GET ALL ENQUIRY
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
    const query = search ? { name: { $regex: search, $options: 'i' } } : {}
    const result = await EnquiryModel.paginate(query, options)

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
      .json({ enquiries: result.docs, nextPage: nextPage, prevPage: prevPage })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ status: ' internet error' })
  }
}

//* GET ENQUIRY COUNTS
module.exports.getEnquiriesCounts = async (req, res) => {
  //* GET COUNTS
  const counts = await EnquiryModel.countDocuments()

  //* IF THERE'S NOT ENQUIRY
  if (!counts) {
    res.status(404).json({ enquiries: 0 })
  } else {
    //* SEND ALL ENQUIRY COUNTS TO THE CLIENT
    return res.status(200).send({ enquiries: counts })
  }
}

//* GET ENQUIRY BY ID
module.exports.getEnquiryById = async (req, res) => {
  //* CHECKING IF ITS A VALID
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json('invalid enquiry id')

  //* FIND THE ENQUIRY BY ID
  const Enquiry = await EnquiryModel.findById({ _id: req.params.id }).sort({
    createdAT: -1,
  })

  //* IF THE ENQUIRY IS NOT FOUND
  if (!Enquiry) {
    return res.status(404).json({ message: 'Enquiry not found' })
  } else {
    //* SEND THE ENQUIRY TO THE CLIENT
    return res.status(200).send({ Enquiry: Enquiry })
  }
}

//* CREATE ENQUIRY
module.exports.post = async (req, res) => {
  //*  VALIDATING THE SCHEMA
  const { error } = EnquirySchemaValidation(req.body)
  if (error) return res.status(422).json(error.details[0].message)

  //* CREATE NEW Enquiry
  const Enquiry = new EnquiryModel(req.body)

  //* SAVE THE CATEGORY TO THE DATA BASE
  await Enquiry.save()

  //* IF ITS NOT CREATED
  if (!Enquiry) {
    return res
      .status(500)
      .json({ message: ' internet error , Enquiry not created' })
  } else {
    //* SEND THE CREATED ENQUIRY TO THE CLIENT
    return res.status(201).json({ created: Enquiry })
  }
}

//* UPDATE ENQUIRY BY ID
module.exports.put = async (req, res) => {
  //* CHECKING IF ITS A VALID ENQUIRY ID
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ error: 'invalid Enquiry id' })

  //* UPDATING THE ENQUIRY
  const updateEnquiry = await EnquiryModel.findByIdAndUpdate(
    { _id: req.params.id },
    {
      status: req.body.status,
    },
    { new: true }
  )

  //* IF ITS NOT UPDATED
  if (!updateEnquiry) {
    return res
      .status(500)
      .json({ message: 'internet error , Enquiry not updated' })
  } else {
    //* SEND THE UPDATED ENQUIRY TO THE CLIENT
    return res.status(200).send({ updated: updateEnquiry })
  }
}

//* DELETE ENQUIRY BY ID
module.exports.delete = async (req, res) => {
  //* CHECKING IF ITS A VALID Enquiry ID
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ error: 'invalid Enquiry id' })

  //* DELETING THE ENQUIRY
  const delEnquiry = await EnquiryModel.findByIdAndDelete({
    _id: req.params.id,
  })

  //* IF ITS NOT DELETED
  if (!delEnquiry) {
    return res
      .status(500)
      .json({ status: 'internet error ', message: 'Enquiry not deleted' })
  } else {
    //* SEND A SUCCESS RESPOND TO THE CLIENT
    return res.status(200).json({ success: true, message: 'deleted Enquiry' })
  }
}
