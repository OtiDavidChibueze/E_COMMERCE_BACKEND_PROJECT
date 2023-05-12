//* SUPER ADMIN ROUTER
const router = require('express').Router()
const controller = require('../controllers/superAdmin')
const { SuperAdminAuth } = require('../middleware/SuperAdminAuthentication')

//* SUPER ADMIN URL ROUTE
router.get(
  '/',
  SuperAdminAuth,
  controller.get_All_SuperAdmins_And_Also_Search_SuperAdmins_With_Emails
)

router.get('/active', SuperAdminAuth, controller.getActiveSuperAdmins)

router.get('/offline', SuperAdminAuth, controller.getOfflineSuperAdmins)

router.get(
  '/active/counts',
  SuperAdminAuth,
  controller.getActiveSuperAdminsCounts
)

router.get(
  '/offline/counts',
  SuperAdminAuth,
  controller.getOfflineSuperAdminsCounts
)

router.get('/getOrder', SuperAdminAuth, controller.getOrder)

router.get('/getCart', SuperAdminAuth, controller.getSuperAdminCart)

router.get('/counts', SuperAdminAuth, controller.get_superAdmins_counts)

router.post('/addToWishList', SuperAdminAuth, controller.addToWishList)

router.get('/wishList', SuperAdminAuth, controller.getWishList)

router.put(
  '/changePassword',
  SuperAdminAuth,
  controller.changeSuperAdminPassword
)

router.get('/:superAdminId', SuperAdminAuth, controller.get_superAdmins_by_id)

router.put('/updateSuperAdmin', SuperAdminAuth, controller.updateSuperAdmin)

router.post('/login', controller.post_login)

router.post('/register', controller.post_register)

router.post('/applyDiscount', SuperAdminAuth, controller.applyDiscount)

router.post('/logout', SuperAdminAuth, controller.post_logOut)

router.put(
  '/:superAdminId',
  SuperAdminAuth,
  controller.put_update_superAdmin_By_Id
)

router.put(
  '/blockSuperAdmin/:superAdminId',
  SuperAdminAuth,
  controller.blockSuperAdminById
)

router.put(
  '/unblockSuperAdmin/:superAdminId',
  SuperAdminAuth,
  controller.unBlockSuperAdminById
)

router.post('/forgotPassword', controller.forgottenPassword)

router.delete('/emptyCart', SuperAdminAuth, controller.emptyCart)

router.put('/resetToken/:token', controller.resetToken)

router.delete('/:superAdminId', SuperAdminAuth, controller.delete_superAdmin)

router.put('/add/Address', SuperAdminAuth, controller.add_Address)

router.post('/addToCart', SuperAdminAuth, controller.addToCart)

router.post('/createOrder', SuperAdminAuth, controller.createOrder)

module.exports = router
