const express = require('express');
const router = express.Router();
const callController = require("../../controllers/callcontroller");

router.post('/create_call', callController.createcall);
router.put('/update_call_duration', callController.updateCallDuration);
router.get('/get_user_callshistory/caller_id=:caller_id', callController.getCallsByCallerId);
router.post('/get_user_call_bycallID', callController.getCallByCallId);
router.delete('/remove_call_bycallerID', callController.removeCallByCallId);

module.exports = router;