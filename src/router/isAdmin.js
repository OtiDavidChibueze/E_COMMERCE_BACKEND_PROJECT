//* ADMIN ROUTER
const router = require('express').Router()
const controller = require('../controllers/isAdmin')

const { authorization } = require('../middleware/authorization')

//* ADMIN URL ROUTE
router.get(
  '/',
  authorization,
  controller.get_All_Admins_And_Also_Search_Admins_With_Emails
)

router.get('/active/counts', authorization, controller.getActiveAdminsCounts)

router.get('/offline/counts', authorization, controller.getOfflineAdminsCounts)

router.get('/getOrder', authorization, controller.getOrder)

router.post('/addToWishList', authorization, controller.addToWishList)

router.get('/getCart', authorization, controller.getAdminCart)

router.get('/counts', authorization, controller.get_admins_counts)

router.get('/wishList', authorization, controller.getWishList)

router.put('/changePassword', authorization, controller.changeAdminPassword)

router.get('/:adminId', authorization, controller.get_admins_by_id)

router.put('/updateAdmin', authorization, controller.updateAdmin)

router.post('/login', controller.post_login)

router.post('/register', authorization, controller.post_register)

router.post('/applyDiscount', authorization, controller.applyDiscount)

router.post('/logout', authorization, controller.post_logOut)

router.put('/:adminId', authorization, controller.put_update_admin_By_Id)

router.put('/blockAdmin/:adminId', authorization, controller.blockAdminById)

router.put('/unblockAdmin/:adminId', authorization, controller.unBlockAdminById)

router.post('/forgotPassword', controller.forgottenPassword)

router.delete('/emptyCart', authorization, controller.emptyCart)

router.put('/resetToken/:token', controller.resetToken)

router.delete('/:adminId', authorization, controller.delete_admin)

router.put('/add/Address', authorization, controller.add_Address)

router.post('/addToCart', authorization, controller.addToCart)

router.post('/createOrder', authorization, controller.createOrder)

module.exports = router
