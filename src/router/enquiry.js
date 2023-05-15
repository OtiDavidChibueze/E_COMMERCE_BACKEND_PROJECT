//* ENQUIRY ROUTER
const express = require('express')
const router = express.Router()
const controller = require('../controllers/enquiry')
const { authorization } = require('../middleware/authorization')

//*  ROUTES
router.get('/', authorization, controller.get)

router.get('/counts', authorization, controller.getEnquiriesCounts)

router.post('/create', controller.post)

router.get('/:id', authorization, controller.getEnquiryById)

router.put('/:id', authorization, controller.put)

router.delete('/:id', authorization, controller.delete)

module.exports = router
