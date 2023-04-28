require('dotenv').config()

module.exports = {
  DB: process.env.DB,
  SERVER_PORT: process.env.SERVER_PORT,
  SECRET: process.env.SECRET,
  ADMIN_SECRET: process.env.ADMIN_SECRET,
  MAIL: process.env.MAIL,
  MAIL_P: process.env.MAIL_P,
}
