//* CATEGORY ROUTER
const express = require('express')
const router = express.Router()
const controller = require('../controllers/category')
const { authorization } = require('../middleware/authorization')

//* URL ROUTES
router.get('/', controller.get)

router.get('/counts', authorization, controller.getCategoryCounts)

router.post('/create', authorization, controller.post)

router.get('/:id', authorization, controller.getCategoryById)

router.put('/:id', authorization, controller.put)

router.delete('/:id', authorization, controller.delete)

module.exports = router
