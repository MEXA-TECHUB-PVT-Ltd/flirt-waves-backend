const express = require('express');
const router = express.Router();
const nightlifeController = require("../../controllers/nightlifecontroller");

router.post('/add_nightlife', nightlifeController.addnightlife);
router.put('/update_nightlife/:id', nightlifeController.updatenightlife);
router.delete('/delete_nightlife/:id', nightlifeController.deletenightlife);
router.get('/getall_nightlifes', nightlifeController.getAllNightlifes);  
router.get('/get_nightlifesbyID/:id', nightlifeController.getNightlifeByID);  

module.exports = router;