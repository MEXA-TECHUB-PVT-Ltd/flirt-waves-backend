const express = require('express');
const router = express.Router();
const nightlifeController = require("../../controllers/nightlifecontroller");

router.post('/add_nightlife', nightlifeController.addnightlife);
router.put('/update_nightlife/:id', nightlifeController.updatenightlife);
router.delete('/delete_nightlife/:id', nightlifeController.deletenightlife);
router.get('/getall_nightlifes', nightlifeController.getAllNightlifes);
router.get('/get_nightlifesbyID/:id', nightlifeController.getNightlifeByID);
router.post('/get_usersof_nightlifeopinion', nightlifeController.getusersofnightlifeopinion);
router.post('/get_filter_nightlife/:user_id', nightlifeController.filterNightlife);

module.exports = router;