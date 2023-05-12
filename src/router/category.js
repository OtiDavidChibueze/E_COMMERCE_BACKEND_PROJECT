//* CATEGORY ROUTER
const express = require('express')
const router = express.Router()
const controller = require('../controllers/category')
const { AdminAuthToken } = require('../middleware/AdminAuthentication')

//* URL ROUTES
router.get('/', controller.get)

router.get('/counts', AdminAuthToken, controller.getCategoryCounts)

router.post('/create', AdminAuthToken, controller.post)

router.get('/:id', AdminAuthToken, controller.getCategoryById)

router.put('/:id', AdminAuthToken, controller.put)

router.delete('/:id', AdminAuthToken, controller.delete)

module.exports = router
