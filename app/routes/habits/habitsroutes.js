const express = require('express');
const router = express.Router();
const habitsController = require("../../controllers/habitscontroller.js");

router.post('/add_habit', habitsController.addhabits);
router.put('/update_habit/:id', habitsController.updateHabits);
router.delete('/delete_habit/:id', habitsController.deleteHabits);
router.get('/getall_habits', habitsController.getAllHabits);  

module.exports = router;