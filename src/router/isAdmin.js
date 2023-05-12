//* ADMIN ROUTER
const router = require('express').Router()
const controller = require('../controllers/isAdmin')
const { SuperAdminAuth } = require('../middleware/SuperAdminAuthentication')
const { AdminAuthToken } = require('../middleware/AdminAuthentication')

//* ADMIN URL ROUTE
router.get(
  '/',
  SuperAdminAuth,
  controller.get_All_Admins_And_Also_Search_Admins_With_Emails
)

router.get('/active/counts', SuperAdminAuth, controller.getActiveAdminsCounts)

router.get('/offline/counts', SuperAdminAuth, controller.getOfflineAdminsCounts)

router.get('/active', SuperAdminAuth, controller.getActiveAdmins)

router.get('/offline', SuperAdminAuth, controller.getOfflineAdmins)

router.get('/getOrder', SuperAdminAuth, controller.getOrder)

router.get('/getCart', AdminAuthToken, controller.getAdminCart)

router.get('/counts', SuperAdminAuth, controller.get_Admins_counts)

router.post('/addToWishList', AdminAuthToken, controller.addToWishList)

router.get('/wishList', AdminAuthToken, controller.getWishList)

router.put('/changePassword', AdminAuthToken, controller.changeAdminPassword)

router.get('/:adminId', SuperAdminAuth, controller.get_Admins_by_id)

router.put('/update', AdminAuthToken, controller.updateAdmin)

router.post('/login', controller.post_login)

router.post('/register', SuperAdminAuth, controller.post_register)

router.post('/applyDiscount', AdminAuthToken, controller.applyDiscount)

router.post('/logout', AdminAuthToken, controller.post_logOut)

router.put('/:adminId', SuperAdminAuth, controller.put_update_Admin_By_Id)

router.put('/blockUser/:adminId', SuperAdminAuth, controller.blockAdminById)

router.put('/unblockUser/:adminId', SuperAdminAuth, controller.unBlockAdminById)

router.post('/forgotPassword', controller.forgottenPassword)

router.delete('/emptyCart', AdminAuthToken, controller.emptyCart)

router.put('/resetToken/:token', controller.resetToken)

router.delete('/:adminId', SuperAdminAuth, controller.delete_Admin)

router.put('/add/Address', AdminAuthToken, controller.add_Address)

router.post('/addToCart', AdminAuthToken, controller.addToCart)

router.post('/createOrder', AdminAuthToken, controller.createOrder)

module.exports = router
