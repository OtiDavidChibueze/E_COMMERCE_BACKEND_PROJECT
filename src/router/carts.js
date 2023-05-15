//* CART ROUTER
const router = require('express').Router()
const controller = require('../controllers/cart')
const { authorization } = require('../middleware/authorization')

//* CART ROUTERS

router.get('/', authorization, controller.getCarts)

router.get('/:id', authorization, controller.getCartById)

module.exports = router
