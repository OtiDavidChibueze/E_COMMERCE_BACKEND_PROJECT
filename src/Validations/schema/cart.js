//* CART SCHEMA VALIDATION
const joi = require('joi')

const cartSchemaValidation = (data) => {
  const cartSchema = joi
    .object({
      user: joi
        .string()
        .options(new RegExp('^[0-9a-fA-F{24}$]'))
        .required()
        .min(24)
        .max(24),
      items: joi.array().items(
        joi.object({
          product: joi
            .string()
            .options(new RegExp('^[0-9a-fA-F{24}$]'))
            .required()
            .min(24)
            .max(24),
          quantity: joi.number().required().default(1),
        })
      ),
      shippingDetails: joi
        .string()
        .options(new RegExp('^[0-9a-fA-F{24}$]'))
        .required()
        .min(24)
        .max(24),
    })
    .options({ stripUnknown: true })

  return cartSchema.validate(data, { abortEarly: false })
}

module.exports.cartSchemaValidation = cartSchemaValidation
