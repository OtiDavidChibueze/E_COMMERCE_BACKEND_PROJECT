//* ORDER ROUTE
const router = require('express').Router()
const controller = require('../controllers/order')
const { AdminAuthToken } = require('../middleware/AdminAuthentication')

//* ORDER ROUTES

router.get('/', AdminAuthToken, controller.getOrders)

router.get('/counts', AdminAuthToken, controller.getOrdersCounts)

router.get('/:id', AdminAuthToken, controller.getOrderById)

router.put(
  '/updateStatus/:orderId',
  AdminAuthToken,
  controller.updateUserOrderStatus
)

module.exports = router
