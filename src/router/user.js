//* USER ROUTER
const router = require('express').Router()
const controller = require('../controllers/user')

const { authorization } = require('../middleware/authorization')

//* USER URL ROUTE
router.get(
  '/',
  authorization,
  controller.get_All_Users_And_Also_Search_Users_With_Emails
)

router.get('/active/counts', authorization, controller.getActiveUsersCounts)

router.get('/offline/counts', authorization, controller.getOfflineUsersCounts)

router.get('/getOrder', authorization, controller.getOrder)

router.post('/addToWishList', authorization, controller.addToWishList)

router.get('/getCart', authorization, controller.getUserCart)

router.get('/counts', authorization, controller.get_users_counts)

router.get('/wishList', authorization, controller.getWishList)

router.put('/changePassword', authorization, controller.changeUserPassword)

router.get('/:userId', authorization, controller.get_users_by_id)

router.put('/updateUser', authorization, controller.updateUser)

router.post('/login', controller.post_login)

router.post('/register', controller.post_register)

router.post('/applyDiscount', authorization, controller.applyDiscount)

router.post('/logout', authorization, controller.post_logOut)

router.put('/:userId', authorization, controller.put_update_user_By_Id)

router.put('/blockUser/:userId', authorization, controller.blockUserById)

router.put('/unblockUser/:userId', authorization, controller.unBlockUserById)

router.post('/forgotPassword', controller.forgottenPassword)

router.delete('/emptyCart', authorization, controller.emptyCart)

router.put('/resetToken/:token', controller.resetToken)

router.delete('/:userId', authorization, controller.delete_user)

router.put('/add/Address', authorization, controller.add_Address)

router.post('/addToCart', authorization, controller.addToCart)

router.post('/createOrder', authorization, controller.createOrder)

module.exports = router
