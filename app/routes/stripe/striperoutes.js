const express = require('express');
const router = express.Router();
const stripeController = require("../../controllers/stripecontroller");

router.post('/create_product', stripeController.createproduct); 
router.post('/add_card', stripeController.addNewCard);  

module.exports = router;