//* PRODUCT SCHEMA VALIDATION
const joi = require('joi')

const productSchemaValidation = (data) => {
  const productSchema = joi
    .object({
      title: joi.string().required().lowercase().min(2),
      brand: joi.string().required(),
      price: joi.number().required().default(0),
      countInStock: joi.number().required().min(0).max(1000),
      description: joi.string().required(),
      category: joi
        .string()
        .regex(/^[a-fA-F0-9]{24}$/)
        .required(),
      isFeatured: joi.boolean().required().default(false),
    })
    .options({ stripUnknown: true })

  return productSchema.validate(data, { abortEarly: false })
}

module.exports.productSchemaValidation = productSchemaValidation
