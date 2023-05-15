//* SUPER ADMIN ROUTER
const router = require('express').Router()
const controller = require('../controllers/superAdmin')

const { authorization } = require('../middleware/authorization')

//* SUPER ADMIN URL ROUTE
router.get(
  '/',
  authorization,
  controller.get_All_SuperAdmins_And_Also_Search_SuperAdmins_With_Emails
)

router.get(
  '/active/counts',
  authorization,
  controller.getActiveSuperAdminsCounts
)

router.get(
  '/offline/counts',
  authorization,
  controller.getOfflineSuperAdminsCounts
)

router.get('/getOrder', authorization, controller.getOrder)

router.post('/addToWishList', authorization, controller.addToWishList)

router.get('/getCart', authorization, controller.getSuperAdminCart)

router.get('/counts', authorization, controller.get_superAdmins_counts)

router.get('/wishList', authorization, controller.getWishList)

router.put(
  '/changePassword',
  authorization,
  controller.changeSuperAdminPassword
)

router.get('/:superAdminId', authorization, controller.get_superAdmins_by_id)

router.put('/updateSuperAdmin', authorization, controller.updateSuperAdmin)

router.post('/login', controller.post_login)

router.post('/register', authorization, controller.post_register)

router.post('/applyDiscount', authorization, controller.applyDiscount)

router.post('/logout', authorization, controller.post_logOut)

router.put(
  '/:superAdminId',
  authorization,
  controller.put_update_superAdmin_By_Id
)

router.put(
  '/blockSuperAdmin/:superAdminId',
  authorization,
  controller.blockSuperAdminById
)

router.put(
  '/unblockSuperAdmin/:superAdminId',
  authorization,
  controller.unBlockSuperAdminById
)

router.post('/forgotPassword', controller.forgottenPassword)

router.delete('/emptyCart', authorization, controller.emptyCart)

router.put('/resetToken/:token', controller.resetToken)

router.delete('/:superAdminId', authorization, controller.delete_superAdmin)

router.put('/add/Address', authorization, controller.add_Address)

router.post('/addToCart', authorization, controller.addToCart)

router.post('/createOrder', authorization, controller.createOrder)

module.exports = router
