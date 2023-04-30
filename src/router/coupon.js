//* COUPON ROUTER
const express = require('express')
const router = express.Router()
const controller = require('../controllers/coupon')
const { AdminAuthToken } = require('../middleware/AdminAuthentication')

//*  ROUTES
router.get('/', controller.get)

router.get('/counts', AdminAuthToken, controller.getCouponCounts)

router.post('/create', AdminAuthToken, controller.post)

router.get('/:couponId', AdminAuthToken, controller.getCouponById)

router.put('/:couponId', AdminAuthToken, controller.put)

router.delete('/:couponId', AdminAuthToken, controller.delete)

module.exports = router
