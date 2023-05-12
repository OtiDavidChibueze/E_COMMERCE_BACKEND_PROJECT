const joi = require('joi')

//* IS ADMIN REGISTER SCHEMA VALIDATION
module.exports.isAdminRegisterSchemaValidation = (data) => {
  const registerSchema = joi
    .object({
      fullName: joi.string().required().min(3).max(20),
      email: joi.string().required().lowercase().email(),
      password: joi.string().required().min(5).max(20),
      mobile: joi
        .string()
        .regex(/^0[0-9]{10}$/)
        .required(),
      country: joi.string().required(),
      city: joi.string().required(),
      zipCode: joi.string().required(),
      street: joi.string().required(),
      homeAddress: joi.string().required(),
    })
    .options({ stripUnknown: true })
  return registerSchema.validate(data, { abortEarly: false })
}

//* IS ADMIN UPDATE SCHEMA VALIDATION
module.exports.isAdminUpdateSchemaValidation = (data) => {
  const registerSchema = joi.object({
    fullName: joi.string().required().min(3),
    mobile: joi
      .string()
      .regex(/^0[0-9]{10}$/)
      .required(),
    country: joi.string().required().min(3),
    city: joi.string().required().min(3),
    zipCode: joi.string().required(),
    street: joi.string().required(),
    homeAddress: joi.string().required(),
  })
  return registerSchema.validate(data, { abortEarly: false })
}

//* ADMIN PASSWORD RESET AND PASSWORD CHANGE VALIDATION
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
