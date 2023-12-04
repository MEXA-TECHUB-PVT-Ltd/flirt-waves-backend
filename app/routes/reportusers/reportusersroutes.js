const express = require('express');
const router = express.Router();
const reportusersController = require("../../controllers/reportuserscontroller");

router.post('/report_user/:user_id', reportusersController.reportuser);
router.get('/get_Reported_Users', reportusersController.getReportedUsers); 

module.exports = router;