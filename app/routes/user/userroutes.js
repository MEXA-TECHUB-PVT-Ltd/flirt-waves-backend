const express = require('express');
const router = express.Router();
const userController = require("../../controllers/usercontroller");

router.post('/user_signup', userController.usersignup);
router.post('/user_signin', userController.usersignin);
router.get('/get_all_users', userController.getallusers);
router.get('/get_user_by_ID/:id', userController.getalluserbyID);
router.put('/update_userprofile/:id', userController.updateuserprofile);
router.post('/forget_password', userController.forgetpassword); 
router.put('/update_password', userController.updatepassword); 
router.delete('/delete_user/:id', userController.deleteuser); 
router.get('/getall_deleted_users', userController.getalldeletedusers); 
router.delete('/deleteuser_permanently/:id', userController.deleteuserpermanently);  

module.exports = router;