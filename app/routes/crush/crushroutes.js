const express = require('express');
const router = express.Router();
const crushController = require("../../controllers/crushcontroller");

router.post('/add/:userId', crushController.addcrush); 
router.get('/getusercrushes/:userId', crushController.getUserCrushes);  

module.exports = router;