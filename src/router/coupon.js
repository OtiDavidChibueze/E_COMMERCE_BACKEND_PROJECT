//* COUPON ROUTER
const express = require('express')
const router = express.Router()
const controller = require('../controllers/coupon')
const { authorization } = require('../middleware/authorization')

//*  ROUTES
router.get('/', authorization, controller.get)

router.get('/counts', authorization, controller.getCouponCounts)

router.post('/create', authorization, controller.post)

router.get('/:couponId', authorization, controller.getCouponById)

router.put('/:couponId', authorization, controller.put)

router.delete('/:couponId', authorization, controller.delete)

module.exports = router
