const express = require('express');
const router = express.Router();
const stripeController = require("../../controllers/stripecontroller");

router.post('/create_customer', stripeController.createCustomer);
router.post('/add_card', stripeController.addNewCard);
router.post('/create_charges', stripeController.createCharges); 

module.exports = router;