//* CLOUDINARY CONFIGURATION
const cloudinary = require('cloudinary').v2
const keys = require('../config/keys')

cloudinary.config({
  cloud_name: keys.CLOUD_NAME,
  api_key: keys.CLOUD_API_KEY,
  api_secret: keys.CLOUD_API_SECRET,
  secure: true,
})

//* CLOUDINARY UPLOADS
const cloudinaryUploads = async (fileToUploads) => {
  return new Promise((resolve) => {
    cloudinary.uploader.upload(fileToUploads, (err, result) => {
      if (err) {
        console.log(err)
        return resolve(null)
      } else {
        return resolve(
          {
            urls: result.secure_url,
          },
          {
            resource_type: 'auto',
          }
        )
      }
    })
  })
}

module.exports = cloudinaryUploads
