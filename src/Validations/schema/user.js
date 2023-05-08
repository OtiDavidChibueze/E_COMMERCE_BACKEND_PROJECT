//* USER SCHEMA VALIDATION
const joi = require('joi')

//* VALIDATION SCHEMA
module.exports.userRegisterSchemaValidation = (data) => {
  const userSchema = joi
    .object({
      email: joi.string().required().email().lowercase(),
      password: joi.string().min(6).max(20).required(),
      userName: joi.string().min(3).max(20).required(),
      mobile: joi
        .string()
        .regex(/^0[0-9]{10}$/)
        .required(),
      country: joi.string().required().min(3),
    })
    .options({ stripUnknown: true })

  return userSchema.validate(data, { abortEarly: false })
}

//* USER UPDATE SCHEMA VALIDATION
module.exports.userUpdateSchemaValidation = (data) => {
  const userSchema = joi
    .object({
      userName: joi.string().required().min(3).max(20),
      country: joi.string().required(),
      mobile: joi
        .string()
        .regex(/^0[0-9]{10}$/)
        .required(),
    })
    .options({ stripUnknown: true })

  return userSchema.validate(data, { abortEarly: false })
}

//* USER PASSWORD RESET AND CHANGE PASSWORD VALIDATIONS
module.exports.resetAndChangePasswordValidation = (data) => {
  const schema = joi
    .object({
      newPassword: joi.string().min(6).max(20).required(),
    })
    .options({ stripUnknown: true })

  return schema.validate(data, { abortEarly: false })
}
