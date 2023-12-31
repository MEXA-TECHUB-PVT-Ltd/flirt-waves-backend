const express = require('express');
const router = express.Router();
const cookingskillsController = require("../../controllers/cookingskillscontroller.js");

router.post('/add_cookingskill', cookingskillsController.addCookingskill);
router.put('/update_cookingskill/:id', cookingskillsController.updatecookingskill);
router.delete('/delete_cookingskill/:id', cookingskillsController.deleteCookingskill);
router.get('/getall_cookingskill', cookingskillsController.getAllcookingskill); 
router.post('/get_usersof_cookingskill', cookingskillsController.getusersofcookingskill); 
router.post('/get_filter_cookingskill/:user_id', cookingskillsController.filtercookingskill);    

module.exports = router;