const express = require('express');
const router = express.Router();
const adminController = require("../../controllers/admin");

router.post('/signup', adminController.adminsignup);
router.post('/signin', adminController.login);
router.post('/password/forgetpassword', adminController.forgetpassword);
router.put('/password/updatepassword', adminController.updatePassword);

module.exports = router;