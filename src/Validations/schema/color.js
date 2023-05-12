//* COLOR SCHEMA VALIDATION
const joi = require('joi')

const ColorSchemaValidation = (data) => {
  const ColorSchema = joi
    .object({
      title: joi.string().required().min(3).max(20),
    })
    .options({ stripUnknown: true })

  return ColorSchema.validate(data, { abortEarly: true })
}

module.exports.ColorSchemaValidation = ColorSchemaValidation
