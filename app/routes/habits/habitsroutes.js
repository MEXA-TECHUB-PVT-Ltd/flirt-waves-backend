const express = require('express');
const router = express.Router();
const habitsController = require("../../controllers/habitscontroller.js");

router.post('/add_habit', habitsController.addhabits);
router.put('/update_habit/:id', habitsController.updateHabits);
router.delete('/delete_habit/:id', habitsController.deleteHabits);
router.get('/getall_habits', habitsController.getAllHabits); 
router.post('/get_usersof_habit', habitsController.getusersofhabit); 
router.post('/get_filter_habit/:user_id', habitsController.filterHabits);    

module.exports = router;