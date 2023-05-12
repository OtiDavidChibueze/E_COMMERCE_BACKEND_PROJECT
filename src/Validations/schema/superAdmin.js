//* SUPER ADMIN SCHEMA VALIDATION
const joi = require('joi')

const superAdminRegisterSchemaValidation = (data) => {
  const Schema = joi
    .object({
      fullName: joi.string().required().min(3).max(20),
      email: joi.string().required().email().lowercase(),
      password: joi
        .string()
        .required()
        .min(6)
        .max(20)
        .options(new RegExp('^[a-zA-F0-9{6,30}$]')),
      phone: joi.string().required().options(new RegExp('^[0-9]$')),
      country: joi.string().required(),
    })
    .options({ stripUnknown: true })

  return Schema.validate(data, { abortEarly: false })
}

module.exports.superAdminRegisterSchemaValidation =
  superAdminRegisterSchemaValidation

//* SUPER ADMIN LOGIN SCHEMA VALIDATION

const superAdminLoginSchemaValidation = (data) => {
  const Schema = joi
    .object({
      email: joi.string().required().email().lowercase(),
      password: joi
        .string()
        .required()
        .min(6)
        .max(20)
        .options(new RegExp('^[a-zA-F0-9{6,30}$]')),
    })
    .options({ stripUnknown: true })

  return Schema.validate(data, { abortEarly: false })
}

module.exports.superAdminLoginSchemaValidation = superAdminLoginSchemaValidation

//* UPDATE SUPER ADMIN SCHEMA
const updateSuperAdminSchemaValidation = (data) => {
  const Schema = joi
    .object({
      fullName: joi.string().required().min(3).max(20),
      phone: joi
        .string()
        .required()
        .options(new RegExp('^[0-9]$'))
        .min(11)
        .max(11),
      country: joi.string().required(),
    })
    .options({ stripUnknown: true })

  return Schema.validate(data, { abortEarly: false })
}

module.exports.updateSuperAdminSchemaValidation =
  updateSuperAdminSchemaValidation
