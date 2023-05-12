//* SUPER ADMIN ROUTER
const router = require('express').Router()
const controller = require('../controllers/superAdmin')
const { AdminAuthToken } = require('../middleware/AdminAuthentication')
const { SuperAdminAuth } = require('../middleware/SuperAdminAuthentication')

//* SUPER ADMIN ROUTES
router.get(
  '/',
  SuperAdminAuth,
  controller.getSuperAdminsOrSearchForSuperAdminsUsingEmail
)

router.get('/counts', SuperAdminAuth, controller.get_SuperAdmins_Counts)

router.get('/active/on', SuperAdminAuth, controller.get_SuperAdmins_Active)

router.get('/active/off', SuperAdminAuth, controller.get_SuperAdmins_non_Active)

router.post('/register', SuperAdminAuth, controller.register_SuperAdmins)

router.put('/changePassword', AdminAuthToken, controller.changePassword)

router.put('/login', controller.login_SuperAdmin)

router.post('/logout', SuperAdminAuth, controller.logOut_SuperAdmin)

router.get('/:superAdminId', SuperAdminAuth, controller.get_SuperAdmins_By_Id)

router.put('/:superAdminId', SuperAdminAuth, controller.update_SuperAdmins)

router.delete('/:superAdminId', SuperAdminAuth, controller.delete_SuperAdmins)

router.post('/forgottenPassword', controller.forgottenPassword)

router.put('/resetToken/:tokenId', controller.resetToken)

router.put('/block/:superAdminId', SuperAdminAuth, controller.blockSuperAdmins)

router.put(
  '/unblock/:superAdminId',
  SuperAdminAuth,
  controller.unBlockSuperAdmin
)

module.exports = router
