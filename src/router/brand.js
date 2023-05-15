//* BRAND ROUTER
const express = require('express')
const router = express.Router()
const controller = require('../controllers/brand')
const { authorization } = require('../middleware/authorization')

//*  ROUTES
router.get('/', controller.get)

router.get('/counts', authorization, controller.getBrandCounts)

router.post('/create', authorization, controller.post)

router.get('/:id', authorization, controller.getBrandById)

router.put('/:id', authorization, controller.put)

router.delete('/:id', authorization, controller.delete)

module.exports = router
