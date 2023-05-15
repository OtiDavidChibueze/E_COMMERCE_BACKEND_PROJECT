//* COLOR ROUTER
const express = require('express')
const router = express.Router()
const controller = require('../controllers/color')
const { authorization } = require('../middleware/authorization')

//*  ROUTES
router.get('/', authorization, controller.get)

router.get('/counts', authorization, controller.getColorsCounts)

router.post('/create', authorization, controller.post)

router.get('/:id', authorization, controller.getColorById)

router.put('/:id', authorization, controller.put)

router.delete('/:id', authorization, controller.delete)

module.exports = router
