const express = require('express');
const router = express.Router();
const feedbackController = require("../../controllers/feedbackcontroller"); 

router.post('/addFeedback/:userId', feedbackController.addFeedback);    
router.put('/updateFeedback/:userId', feedbackController.updateFeedback);
router.delete('/remove_Feedback/:userId', feedbackController.removeFeedback); 
router.get('/getAll_user_Feedbacks/:userId', feedbackController.getAllFeedbacksByUserId);      

module.exports = router;