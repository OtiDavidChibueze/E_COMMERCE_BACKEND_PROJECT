//* DATABASE CONNECTION
const mongoose = require('mongoose')
const keys = require('./keys')

const DB = keys.DB

const connectionToDataBase = () => {
  try {
    mongoose.connect(DB, { useNewUrlParser: true, UseUnifiedTopology: true })
    console.log('database connected')
  } catch (err) {
    console.log('database not connected')
  }
}

module.exports = connectionToDataBase
