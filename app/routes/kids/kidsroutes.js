const express = require('express');
const router = express.Router();
const kidsController = require("../../controllers/kidscontroller");

router.post('/add_kidsopinion', kidsController.addkidsopinion);
router.put('/update_kidsopinion/:id', kidsController.updatekidsopinion);
router.delete('/delete_kidsopinion/:id', kidsController.deletekidsopinion);
router.get('/getall_kidsopinions', kidsController.getAllkidopinions);  
router.get('/get_kidopinionbyID/:id', kidsController.getKidopinionByID);
router.post('/get_usersof_kidopinion', kidsController.getusersofkidopinion);
router.post('/get_filter_kidopinion/:user_id', kidsController.filterKidsOpinion);    

module.exports = router;