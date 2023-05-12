//* IS ADMIN ROUTER
const router = require('express').Router()
const controller = require('../controllers/isAdmin')
const { AdminAuthToken } = require('../middleware/AdminAuthentication')
const { SuperAdminAuth } = require('../middleware/SuperAdminAuthentication')

//* IS ADMIN ROUTES
router.get('/', SuperAdminAuth, controller.getAdminsOrSearchForAdminsUsingEmail)

router.get('/counts', SuperAdminAuth, controller.get_Admins_Counts)

router.get('/active/on', SuperAdminAuth, controller.get_Admins_Active)

router.get('/active/off', SuperAdminAuth, controller.get_Admins_non_Active)

router.post('/register', SuperAdminAuth, controller.register_Admins)

router.put('/changePassword', AdminAuthToken, controller.changePassword)

router.put('/login', controller.login_Admin)

router.put('/updateAdmin', AdminAuthToken, controller.updateAdmin)

router.post('/logout', AdminAuthToken, controller.logOut_Admin)

router.get('/:adminId', SuperAdminAuth, controller.get_Admins_By_Id)

router.put('/:adminId', SuperAdminAuth, controller.update_Admins_By_Id)

router.delete('/:adminId', SuperAdminAuth, controller.delete_Admin)

router.post('/forgottenPassword', controller.forgottenPassword)

router.put('/resetToken/:tokenId', controller.resetToken)

router.put('/block/:adminId', SuperAdminAuth, controller.blockAdmin)

router.put('/unblock/:adminId', SuperAdminAuth, controller.unBlockAdmin)

module.exports = router
