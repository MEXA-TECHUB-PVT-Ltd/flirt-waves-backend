const express = require('express');
const router = express.Router();
const callController = require("../../controllers/callcontroller");

router.post('/create_call', callController.createcall);
router.get('/get_user_calls/callerId=:callerId', callController.getCallsByCallerId); 
router.get('/get_user_call_byID/callerId=:callerId/callId=:callId', callController.getCallByCallId);  
router.delete('/remove_user_call_byID/callerId=:callerId/callId=:callId', callController.removeCallByCallId);    

module.exports = router;