//* CATEGORY SCHEMA VALIDATION
const joi = require('joi')

const categorySchemaValidation = (data) => {
  const categorySchema = joi
    .object({
      title: joi.string().required().min(3).max(20),
      icon: joi.string(),
      color: joi.string(),
    })
    .options({ stripUnknown: true })

  return categorySchema.validate(data, { abortEarly: true })
}

module.exports.categorySchemaValidation = categorySchemaValidation
