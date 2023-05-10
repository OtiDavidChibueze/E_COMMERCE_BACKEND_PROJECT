//* USER ROUTER
const router = require('express').Router()
const controller = require('../controllers/user')
const { AdminAuthToken } = require('../middleware/AdminAuthentication')
const { UserAuthToken } = require('../middleware/UserAuthentication')

//* USER URL ROUTE
router.get(
  '/',
  AdminAuthToken,
  controller.get_All_Users_And_Also_Search_Users_With_Emails
)

router.get('/getCart', UserAuthToken, controller.getUserCart)

router.get('/counts', AdminAuthToken, controller.get_users_counts)

router.get('/wishList', UserAuthToken, controller.getWishList)

router.put('/changePassword', UserAuthToken, controller.changeUserPassword)

router.get('/:userId', AdminAuthToken, controller.get_users_by_id)

router.post('/login', controller.post_login)

router.post('/register', controller.post_register)

router.post('/applyDiscount', UserAuthToken, controller.applyDiscount)

router.post('/logout', UserAuthToken, controller.post_logOut)

router.put('/:userId', UserAuthToken, controller.put_update_user)

router.put('/blockUser/:userId', AdminAuthToken, controller.blockUserById)

router.put('/unblockUser/:userId', AdminAuthToken, controller.unBlockUserById)

router.post('/forgotPassword', controller.forgottenPassword)

router.delete('/emptyCart', UserAuthToken, controller.emptyCart)

router.put('/resetToken/:token', controller.resetToken)

router.delete('/:userId', AdminAuthToken, controller.delete_user)

router.put('/add/Address', UserAuthToken, controller.add_Address)

router.post('/addToCart', UserAuthToken, controller.addToCart)

module.exports = router
