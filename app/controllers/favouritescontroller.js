const pool = require("../config/dbconfig")

const addToFavorites = async (req, res) => {
    const { user_id } = req.params;
    const { favorite_user_id } = req.body;

    try {
        // Check if the user exists
        const userExists = await pool.query('SELECT EXISTS(SELECT 1 FROM Users WHERE id = $1)', [user_id]);
        if (!userExists.rows[0].exists) {
            return res.status(404).json({ error: true, msg: 'User not found' });
        }

        // Check if the favorite user exists
        const favoriteUserExists = await pool.query('SELECT * FROM Users WHERE id = $1', [favorite_user_id]);
        if (favoriteUserExists.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Favorite user not found' });
        }

        // Check if the favorite relationship already exists
        const checkExistence = await pool.query('SELECT EXISTS(SELECT 1 FROM Favorites WHERE user_id = $1 AND favorite_user_id = $2)', [user_id, favorite_user_id]);
        if (!checkExistence.rows[0].exists) {
            await pool.query('INSERT INTO Favorites (user_id, favorite_user_id) VALUES ($1, $2)', [user_id, favorite_user_id]);
        }

        // Fetch details of the user added to favorites
        const addedUserDetails = favoriteUserExists.rows[0];

        res.status(200).json({ error: false, msg: 'User added to favorites successfully', addedUser: addedUserDetails });
    } catch (error) {
        console.error('Error adding to favorites:', error);
        res.status(500).json({ error: true, msg: 'Internal Server Error' });
    }
};

const getFavoritesbyuserID = async (req, res) => {
    const { user_id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
        // Check if the user exists
        const userExists = await pool.query('SELECT EXISTS(SELECT 1 FROM Users WHERE id = $1)', [user_id]);
        if (!userExists.rows[0].exists) {
            return res.status(404).json({ error: true, msg: 'User not found' });
        }

        // Calculate the OFFSET based on the page and limit
        const offset = (page - 1) * limit;

        // Query to retrieve user's favorite profiles with pagination
        const favoritesQuery = `
        SELECT Users.*, COUNT(*) OVER() AS total_count
        FROM Users
        INNER JOIN Favorites ON Users.id = Favorites.favorite_user_id
        WHERE Favorites.user_id = $1
        ORDER BY Users.id
        OFFSET $2
        LIMIT $3
      `;

        const favoritesResult = await pool.query(favoritesQuery, [user_id, offset, limit]);
        const favorites = favoritesResult.rows;

        // Extract the total count from the first row of the result
        const totalCount = favorites.length > 0 ? favorites[0].total_count : 0;

        res.status(200).json({
            error: false,
            msg: 'Favorites fetched successfully',
            count: favorites.length,
            total_count: totalCount,
            data: favorites,
        });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({ error: true, msg: 'Internal Server Error' });
    }
};

const getFavoriteById = async (req, res) => {
    const { user_id } = req.params;
    const { favorite_id } = req.body;

    try {
        // Check if the user exists
        const userExists = await pool.query('SELECT EXISTS(SELECT 1 FROM Users WHERE id = $1)', [user_id]);
        if (!userExists.rows[0].exists) {
            return res.status(404).json({ error: true, msg: 'User not found' });
        }

        // Query to retrieve the specific favorite of the user
        const favoriteQuery = `
            SELECT Users.*
            FROM Users
            INNER JOIN Favorites ON Users.id = Favorites.favorite_user_id
            WHERE Favorites.user_id = $1 AND Favorites.favorite_user_id = $2
        `;

        const favoriteResult = await pool.query(favoriteQuery, [user_id, favorite_id]);
        const favorite = favoriteResult.rows;

        if (favorite.length === 0) {
            return res.status(404).json({ error: true, msg: 'Favorite not found for the user' });
        }

        res.status(200).json({
            error: false,
            msg: 'Favorite fetched successfully',
            data: favorite,
        });
    } catch (error) {
        console.error('Error fetching favorite:', error);
        res.status(500).json({ error: true, msg: 'Internal Server Error' });
    }
}

const getAllFavorites = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    try {
        // Calculate the OFFSET based on the page and limit
        const offset = (page - 1) * limit;

        // Query to retrieve all favorites with pagination
        const favoritesQuery = `
        SELECT Users.*, Favorites.user_id AS favorited_by_user_id, COUNT(*) OVER() AS total_count
        FROM Users
        INNER JOIN Favorites ON Users.id = Favorites.favorite_user_id
        ORDER BY Favorites.user_id, Users.id
        OFFSET $1
        LIMIT $2
      `;

        const favoritesResult = await pool.query(favoritesQuery, [offset, limit]);
        const favorites = favoritesResult.rows;

        // Extract the total count from the first row of the result
        const totalCount = favorites.length > 0 ? favorites[0].total_count : 0;

        res.status(200).json({
            error: false,
            msg: 'All favorites fetched successfully',
            count: favorites.length,
            total_count: totalCount,
            data: favorites,
        });
    } catch (error) {
        console.error('Error fetching all favorites:', error);
        res.status(500).json({ error: true, msg: 'Internal Server Error' });
    }
};

const removeFavorite = async (req, res) => {
    const { user_id, favorite_id } = req.params;

    try {
        // Check if the user exists
        const userExists = await pool.query('SELECT EXISTS(SELECT 1 FROM Users WHERE id = $1)', [user_id]);
        if (!userExists.rows[0].exists) {
            return res.status(404).json({ error: true, msg: 'User not found' });
        }

        // Check if the favorite exists in the user's favorites list
        const favoriteExists = await pool.query('SELECT EXISTS(SELECT 1 FROM Favorites WHERE user_id = $1 AND favorite_user_id = $2)', [user_id, favorite_id]);
        if (!favoriteExists.rows[0].exists) {
            return res.status(404).json({ error: true, msg: 'Favorite not found in user favorites' });
        }

        // Remove the favorite from the user's favorites list
        await pool.query('DELETE FROM Favorites WHERE user_id = $1 AND favorite_user_id = $2', [user_id, favorite_id]);

        res.status(200).json({ error: false, msg: 'Favorite removed successfully' });
    } catch (error) {
        console.error('Error removing favorite:', error);
        res.status(500).json({ error: true, msg: 'Internal Server Error' });
    }
};

const checkFavoriteStatus = async (req, res) => {
    const { user_id, favorite_id } = req.body;
// console.log(user_id,favorite_id);
    if (!user_id || !favorite_id) {
        return res.status(400).json({ error: true, msg: 'User ID and Favorite ID are required' });
    }

    const checkExistingQuery = `
        SELECT * FROM Favorites
        WHERE user_id = $1 AND favorite_user_id = $2
    `;

    pool.query(checkExistingQuery, [user_id, favorite_id], (err, result) => {
        if (err) {
            console.error('Error checking favorite status:', err);
            return res.status(500).json({ saved_status: false, error: true });
        }

        if (result.rows.length > 0) {
            // Favorite exists for the user
            return res.status(200).json({
                saved_status: true,
                error: false,
                message: 'Favorite found for the user',
            });
        } else {
            return res.status(200).json({
                saved_status: false,
                error: false,
                message: 'Favorite not found for the user',
            });
        }
    });

}

module.exports = { checkFavoriteStatus, getFavoriteById, addToFavorites, getFavoritesbyuserID, getAllFavorites, removeFavorite };