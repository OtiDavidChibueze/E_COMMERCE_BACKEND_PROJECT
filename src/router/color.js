//* COLOR ROUTER
const express = require('express')
const router = express.Router()
const controller = require('../controllers/color')
const { AdminAuthToken } = require('../middleware/AdminAuthentication')

//*  ROUTES
router.get('/', AdminAuthToken, controller.get)

router.get('/counts', AdminAuthToken, controller.getColorsCounts)

router.post('/create', AdminAuthToken, controller.post)

router.get('/:id', AdminAuthToken, controller.getColorById)

router.put('/:id', AdminAuthToken, controller.put)

router.delete('/:id', AdminAuthToken, controller.delete)

module.exports = router
