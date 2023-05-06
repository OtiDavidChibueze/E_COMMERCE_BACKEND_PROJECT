//* MULTER AND SHARP CONFIG
const multer = require('multer')
const sharp = require('sharp')
const path = require('path')

//* MULTER STORAGE
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/images/products'))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() + 1e9)
    cb(null, file.fieldname + '-' + uniqueSuffix + '.jpeg')
  },
})

//* MULTER FILTERING
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true)
  } else {
    cb({ message: 'unsupported file format' }, false)
  }
}

//* MULTER CONFIG
const multerConfig = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fieldSize: 1000 * 1000 * 2 }, //* 2MB
})

//* PRODUCT RESIZE IMAGE CONFIG
const productResizeImage = async (req, res, next) => {
  if (!req.files) return next()

  await Promise.all(
    req.files.map(async (file) => {
      await sharp(file.path)
        .resize(300, 300)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/images/products/${file.filename}`)
    })
  )
  next()
}

module.exports = { multerConfig, productResizeImage }
