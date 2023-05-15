//* ENQUIRY SCHEMA VALIDATION
const joi = require('joi')

const EnquirySchemaValidation = (data) => {
  const EnquirySchema = joi
    .object({
      name: joi.string().required().min(3).max(20),
      email: joi.string().email().required(),
      mobile: joi
        .string()
        .regex(/^0[0-9]{10}$/)
        .required(),
      comment: joi.string().required(),
    })
    .options({ stripUnknown: true })

  return EnquirySchema.validate(data, { abortEarly: true })
}

module.exports.EnquirySchemaValidation = EnquirySchemaValidation
