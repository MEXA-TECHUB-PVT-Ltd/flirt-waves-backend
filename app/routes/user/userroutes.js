const express = require('express');
const router = express.Router();
const userController = require("../../controllers/usercontroller");

router.post('/user_signup', userController.usersignup);
router.post('/user_signin', userController.usersignin);
router.get('/get_all_users', userController.getallusers);
router.get('/get_user_by_ID/:id', userController.getalluserbyID);
router.put('/update_userprofile/:id', userController.updateuserprofile);
router.post('/forget_password', userController.forgetpassword);
router.put('/reset_password', userController.resetpassword);
router.put('/update_password', userController.updatePassword); 
router.delete('/delete_user/:id', userController.deleteuser);
// router.get('/getall_deleted_users', userController.getalldeletedusers);
router.delete('/deleteuser_permanently/:id', userController.deleteuserpermanently);
router.put('/updateuser_status/:id', userController.updateUserBlockStatus);
router.post('/get_preferences_with_filters/:id', userController.getUsersWithFilters);
router.put('/updateuser_verificationstatus/:id', userController.updateUserVerifiedStatus);
router.get('/get_verified_users', userController.getVerifiedUsers);
router.get('/get_verified_user/:id', userController.getVerifiedUserById);
router.post('/getall_dashboard_profiles/:userId', userController.getDashboardprofiles);
router.get('/get_recent_profiles', userController.getrecentprofiles);
router.get('/get_onlineusers', userController.getCurrentlyOnlineUsers); 
router.post('/searchuser_byname', userController.searchUserByName); 
router.get('/getall_blocked_users', userController.getAllUsersWithBlockStatusTrue);   
router.post('/get_user_byYear', userController.getUsersByYearAndMonth);      

module.exports = router;