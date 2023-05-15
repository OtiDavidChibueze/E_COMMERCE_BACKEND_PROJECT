//* ORDER ROUTE
const router = require('express').Router()
const controller = require('../controllers/order')
const { authorization } = require('../middleware/authorization')

//* ORDER ROUTES

router.get('/', authorization, controller.getOrders)

router.get('/counts', authorization, controller.getOrdersCounts)

router.get('/:id', authorization, controller.getOrderById)

router.put(
  '/updateStatus/:orderId',
  authorization,
  controller.updateUserOrderStatus
)

module.exports = router
