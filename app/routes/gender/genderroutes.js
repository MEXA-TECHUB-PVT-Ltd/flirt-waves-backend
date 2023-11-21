const express = require('express');
const router = express.Router();
const genderController = require("../../controllers/gendercontroller");

router.post('/add_gender', genderController.creategender);
router.put('/update_gender/:id', genderController.updateGender);
router.delete('/delete_gender/:id', genderController.deleteGender);
router.get('/getall_genders', genderController.getAllGenders);  
  
module.exports = router;