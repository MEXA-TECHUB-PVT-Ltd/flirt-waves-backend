const express = require('express');
const router = express.Router();
const smokingController = require("../../controllers/smokingcontroller");

router.post('/add_smokingopinion', smokingController.addsmokingopinion);
router.put('/update_smokingopinion/:id', smokingController.updateSmokingopinion);
router.delete('/delete_smokingopinion/:id', smokingController.deleteSmokingopinion);
router.get('/getall_smokingopinions', smokingController.getAllSmokingopinions);  
router.get('/get_smokingopinionbyID/:id', smokingController.getSmokingopinionByID); 
router.post('/get_usersof_smokingopinion', smokingController.getusersofsmokingopinion);   

module.exports = router;