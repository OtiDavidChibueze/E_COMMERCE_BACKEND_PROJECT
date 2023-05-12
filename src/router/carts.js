//* CART ROUTER
const router = require('express').Router()
const controller = require('../controllers/cart')
const { AdminAuthToken } = require('../middleware/AdminAuthentication')

//* CART ROUTERS

router.get('/', AdminAuthToken, controller.getCarts)

router.get('/:id', AdminAuthToken, controller.getCartById)

module.exports = router
