//* BRAND SCHEMA VALIDATION
const joi = require('joi')

const brandSchemaValidation = (data) => {
  const brandSchema = joi
    .object({
      title: joi.string().required().min(3).max(20),
      icon: joi.string(),
      color: joi.string(),
    })
    .options({ stripUnknown: true })

  return brandSchema.validate(data, { abortEarly: true })
}

module.exports.brandSchemaValidation = brandSchemaValidation
