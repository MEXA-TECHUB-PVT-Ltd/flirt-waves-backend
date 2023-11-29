const express = require('express');
const router = express.Router();
const crushController = require("../../controllers/crushcontroller");

router.post('/add/:userId', crushController.addcrush); 
router.get('/getusercrushes/:userId', crushController.getUserCrushes);
router.delete('/remove_user_crush/:userId', crushController.deleteuserCrush);
router.delete('/delete_AllUser_Crushes/:userId', crushController.deleteAllUserCrushes); 
router.get('/get_All_Crushes', crushController.getAllCrushesWithUsers);  
router.put('/update_user_Crushes/:userId ', crushController.updateCrushes);      

module.exports = router;