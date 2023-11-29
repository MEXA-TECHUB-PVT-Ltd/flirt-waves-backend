const express = require('express');
const router = express.Router();
const hobbyController = require("../../controllers/hobbycontroller");

router.post('/add_hobby', hobbyController.addhobby);
router.put('/update_hobby/:id', hobbyController.updatehobby);
router.delete('/delete_hobby/:id', hobbyController.deletehobby);
router.get('/getall_hobbies', hobbyController.getAllHobbiess);  
router.get('/get_hobbiesbyID/:id', hobbyController.getHobbyById);  
router.post('/get_users_ofhobby', hobbyController.getusersofhobby);  

module.exports = router;