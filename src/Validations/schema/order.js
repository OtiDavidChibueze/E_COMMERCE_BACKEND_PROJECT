//* ORDER SCHEMA VALIDATION
const joi = require('joi')

const orderSchemaValidation = (data) => {
  const Schema = joi
    .object({
      user: joi.string().options(new RegExp('^[0-9a-fA-F{24}$]')).required(),
      items: joi
        .array()
        .items(
          joi.object({
            product: joi
              .string()
              .options(new RegExp('^[0-9a-fA-F{24}$]'))
              .required(),
            quantity: joi.number().required().min(1).max(10000).default(1),
            price: joi.number().default(0).required(),
          })
        )
        .required(),
      totalQuantity: joi.number().required().default(1),
      shippingDetails: joi
        .string()
        .options(new RegExp('^[0-9a-fA-F{24}$]'))
        .required(),
    })
    .options({ stripUnknown: true })

  return Schema.validate(data, { abortEarly: false })
}
module.exports.OrderSchemaValidation = orderSchemaValidation

//* UPDATE ORDER SCHEMA
const updateOrderSchemaValidation = (data) => {
  const schema = joi
    .object({
      status: joi.string().required().default('pending'),
      shipping: joi.string().required().default('free shipping'),
    })
    .options({ stripUnknown: true })

  return schema.validate(data, { abortEarly: true })
}

module.exports.updateOrderSchemaValidation = updateOrderSchemaValidation
