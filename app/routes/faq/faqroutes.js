const express = require('express');
const router = express.Router();
const faqController = require("../../controllers/faqcontroller"); 

router.post('/add', faqController.addFAQ);    
router.put('/update/:id', faqController.updateFAQ);
router.delete('/delete/:id', faqController.deleteFAQ); 
router.get('/get_AllFAQs', faqController.getAllFAQs); 
router.get('/get_FAQ_ByID/:id', faqController.getFAQByID);      

module.exports = router;