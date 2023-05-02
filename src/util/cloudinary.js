//* E_COMMERCE CLOUDINARY CONFIG
const cloudinary = require('cloudinary').v2
const keys = require('../config/keys')

//* CLOUD KEYS
cloud_name = keys.CLOUD_NAME
api_key = keys.CLOUD_API_KEY
api_secret = keys.CLOUD_API_SECRET

//* CLOUDINARY CONFIG
cloudinary.config({
  cloud_name: cloud_name,
  api_key: api_key,
  api_secret: api_secret,
  secure: true,
})

//* CLOUDINARY UPLOAD IMAGE FUNCTION
const cloudinaryUploadImg = async (fileToUploads) => {
  return new Promise((resolve) => {
    cloudinary.uploader.upload(fileToUploads, (result) => {
      console.log(result)
      resolve({
        url: result.secure_url,
        resource_type: 'auto',
      })
    })
  })
}

module.exports = cloudinaryUploadImg
