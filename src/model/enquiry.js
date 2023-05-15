//* ENQUIRY MODEL
const mongoose = require('mongoose') //* Erase if already required
const mongoosePaginate = require('mongoose-paginate-v2')

//* Declare the Schema of the Mongo model
var enquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  comment: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: 'submitted',
    enum: ['submitted', 'in progress', 'contacted'],
  },
})

//* PLUGIN MONGOOSE PAGINATE
enquirySchema.plugin(mongoosePaginate)

//* Export the model
module.exports = mongoose.model('Enquiry', enquirySchema)
