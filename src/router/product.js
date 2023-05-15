//* PRODUCT ROUTER
const router = require('express').Router()
const controller = require('../controllers/product')
const { authorization } = require('../middleware/authorization')
const {
  multerConfig,
  productResizeImage,
} = require('../middleware/uploadImages')

//* PRODUCT URL ROUTES
router.get('/', controller.get_products)

router.get('/counts', authorization, controller.get_products_count)

router.put('/likeProduct', authorization, controller.likeAProduct)

router.put('/rate', authorization, controller.rating)

router.put(
  '/upload',
  multerConfig.array('images', 10),
  productResizeImage,
  authorization,
  controller.uploadImages
)

router.put('/disLikeProduct', authorization, controller.disLikeAProduct)

router.get('/featured', authorization, controller.get_featured_products)

router.get('/getProduct/:productId', controller.getProductsByProductId)

router.get(
  '/featured/counts',
  authorization,
  controller.get_featured_products_count
)

router.post('/create', authorization, controller.add_products)

router.put('/:id', authorization, controller.edit_products)

router.delete('/:productId', authorization, controller.delete_products)

router.delete('/delete/:publicId', authorization, controller.deleteImages)

module.exports = router
