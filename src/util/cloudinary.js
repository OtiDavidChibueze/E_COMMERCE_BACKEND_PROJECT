//* CLOUDINARY CONFIGURATION
const cloudinary = require('cloudinary').v2
const keys = require('../config/keys')

cloudinary.config({
  cloud_name: keys.CLOUD_NAME,
  api_key: keys.CLOUD_API_KEY,
  api_secret: keys.CLOUD_API_SECRET,
  secure: true,
})

//* CLOUDINARY IMAGE UPLOADS
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
            asset_id: result.asset_id,
            public_id: result.public_id,
          },
          {
            resource_type: 'auto',
          }
        )
      }
    })
  })
}

//* CLOUDINARY IMAGE DELETE
const cloudinaryDelete = async (fileToDelete) => {
  return new Promise((resolve) => {
    cloudinary.uploader.destroy(fileToDelete, (err, result) => {
      if (err) {
        console.log(err)
        return resolve(null)
      } else {
        return resolve(
          {
            urls: result.secure_url,
            asset_id: result.asset_id,
            public_id: result.public_id,
          },
          {
            resource_type: 'auto',
          }
        )
      }
    })
  })
}

module.exports = { cloudinaryUploads, cloudinaryDelete }
