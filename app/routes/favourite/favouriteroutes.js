const express = require('express');
const router = express.Router();
const favouritescController = require("../../controllers/favouritescontroller");

router.post('/add/user_id/:user_id', favouritescController.addToFavorites);
router.get('/getFavoritesbyuserID/:user_id', favouritescController.getFavoritesbyuserID); 
router.get('/getAll_Favorites', favouritescController.getAllFavorites);
router.delete('/remove/user_id=:user_id/favorite_user_id=:favorite_user_id', favouritescController.removeFavorite);
router.post('/get_users_favouritebyID/user_id=:user_id', favouritescController.getFavoriteById);
router.post('/get_favourite_status', favouritescController.checkFavoriteStatus);
router.get('/get_received_favourite/user_id=:user_id', favouritescController.getUsersWithSameFavorites);   

module.exports = router;