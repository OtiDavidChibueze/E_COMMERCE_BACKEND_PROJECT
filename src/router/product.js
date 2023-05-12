//* PRODUCT ROUTER
const router = require('express').Router()
const controller = require('../controllers/product')
const { UserAuthToken } = require('../middleware/UserAuthentication')
const { AdminAuthToken } = require('../middleware/AdminAuthentication')
const {
  multerConfig,
  productResizeImage,
} = require('../middleware/uploadImages')

//* PRODUCT URL ROUTES
router.get('/', controller.get_products)

router.get('/counts', AdminAuthToken, controller.get_products_count)

router.put('/likeProduct', UserAuthToken, controller.likeAProduct)

router.put('/rate', UserAuthToken, controller.rating)

router.put(
  '/upload/:productId',
  multerConfig.array('images', 10),
  productResizeImage,
  AdminAuthToken,
  controller.uploadImages
)

router.put('/disLikeProduct', UserAuthToken, controller.disLikeAProduct)

router.get('/featured', AdminAuthToken, controller.get_featured_products)

router.get('/getProduct/:productId', controller.getProductsByProductId)

router.get(
  '/featured/counts',
  AdminAuthToken,
  controller.get_featured_products_count
)

router.post('/create', AdminAuthToken, controller.add_products)

router.put('/:id', AdminAuthToken, controller.edit_products)

router.delete('/:productId', AdminAuthToken, controller.delete_products)

module.exports = router
