//* E_COMMERCE KEYS
require('dotenv').config()

module.exports = {
  DB: process.env.DB,
  SERVER_PORT: process.env.SERVER_PORT,
  SECRET: process.env.SECRET,
  ADMIN_SECRET: process.env.ADMIN_SECRET,
  SUPER_ADMIN_SECRET: process.env.SUPER_ADMIN_SECRET,
  MAIL: process.env.MAIL,
  MAIL_P: process.env.MAIL_P,
  CLOUD_NAME: process.env.CLOUD_NAME,
  CLOUD_API_KEY: process.env.CLOUD_API_KEY,
  CLOUD_API_SECRET: process.env.CLOUD_API_SECRET,
}
