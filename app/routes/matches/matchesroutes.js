const express = require('express');
const router = express.Router();
const matchesController = require("../../controllers/matchescontroller");

router.post('/create_match', matchesController.calculateMatchValue);  

module.exports = router;