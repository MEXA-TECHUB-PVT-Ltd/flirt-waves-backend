const express = require('express');
const router = express.Router();
const exerciseController = require("../../controllers/exercisecontroller");

router.post('/add_exercise', exerciseController.addexercise);
router.put('/update_exercise/:id', exerciseController.updateexercise);
router.delete('/delete_exercise/:id', exerciseController.deleteexercise);
router.get('/getall_exercises', exerciseController.getAllexercises);  

module.exports = router;