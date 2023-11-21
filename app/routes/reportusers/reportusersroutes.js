const express = require('express');
const router = express.Router();
const reportusersController = require("../../controllers/reportuserscontroller");

router.post('/report_user/:user_id', reportusersController.reportuser);

module.exports = router;