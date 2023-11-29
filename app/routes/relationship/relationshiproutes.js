const express = require('express');
const router = express.Router();
const relationshipController = require("../../controllers/relationcontroller");

router.post('/add_relation', relationshipController.createRelationship);
router.put('/update_relation/:id', relationshipController.updateRelationship);
router.delete('/delete_relation/:id', relationshipController.deleteRelationship);
router.get('/getall_relations', relationshipController.getAllRelationships);
router.post('/get_users_relation', relationshipController.getusersofrelationtype);

module.exports = router;