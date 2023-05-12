//* SUPER ADMIN SCHEMA VALIDATION
const joi = require('joi')

//* VALIDATION SCHEMA
module.exports.superAdminRegisterSchemaValidation = (data) => {
  const superAdminSchema = joi
    .object({
      email: joi.string().required().email().lowercase(),
      password: joi.string().min(6).max(20).required(),
      superAdminName: joi.string().min(3).max(20).required(),
      mobile: joi
        .string()
        .regex(/^0[0-9]{10}$/)
        .required(),
      country: joi.string().required().min(3),
      address: joi.string().required(),
    })
    .options({ stripUnknown: true })

  return superAdminSchema.validate(data, { abortEarly: false })
}

//* SUPER ADMIN UPDATE SCHEMA VALIDATION
module.exports.superAdminUpdateSchemaValidation = (data) => {
  const superAdminSchema = joi
    .object({
      superAdminName: joi.string().required().min(3).max(20),
      country: joi.string().required(),
      mobile: joi
        .string()
        .regex(/^0[0-9]{10}$/)
        .required(),
      address: joi.string().required(),
    })
    .options({ stripUnknown: true })

  return superAdminSchema.validate(data, { abortEarly: false })
}

//* SUPER ADMIN PASSWORD RESET AND CHANGE PASSWORD VALIDATIONS
module.exports.resetAndChangePasswordValidation = (data) => {
  const schema = joi
    .object({
      newPassword: joi.string().min(6).max(20).required(),
    })
    .options({ stripUnknown: true })

  return schema.validate(data, { abortEarly: false })
}

//* FORGOTTEN PASSWORD EMAIL VALIDATION
module.exports.forgottenPassword = (data) => {
  const schema = joi
    .object({
      email: joi.string().email().required(),
    })
    .options({ stripUnknown: true })

  return schema.validate(data, { abortEarly: false })
}
