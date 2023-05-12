//* BRAND ROUTER
const express = require('express')
const router = express.Router()
const controller = require('../controllers/brand')
const { AdminAuthToken } = require('../middleware/AdminAuthentication')

//*  ROUTES
router.get('/', controller.get)

router.get('/counts', AdminAuthToken, controller.getBrandCounts)

router.post('/create', AdminAuthToken, controller.post)

router.get('/:id', AdminAuthToken, controller.getBrandById)

router.put('/:id', AdminAuthToken, controller.put)

router.delete('/:id', AdminAuthToken, controller.delete)

module.exports = router
