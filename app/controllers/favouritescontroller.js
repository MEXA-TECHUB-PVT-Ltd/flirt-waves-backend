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
        const favoriteUserDetails = await pool.query('SELECT u.id, u.name, u.email, u.password, u.token, u.signup_type, u.images, u.device_id, u.deleted_status, u.block_status, u.height, u.location, u.gender, u.dob, u.latitude, u.longitude, u.verified_status, u.report_status, u.deleted_at, u.created_at, u.updated_at, u.last_active, g.gender AS interested_in_data, r.relation_type AS relation_type_data, c.cooking_skill AS cooking_skill_data, h.habit AS habit_data, e.exercise AS exercise_data, hb.hobby AS hobby_data, s.smoking_opinion AS smoking_opinion_data, k.kids_opinion AS kids_opinion_data, n.night_life AS night_life_data FROM Users u LEFT JOIN Gender g ON CAST(u.interested_in AS INTEGER) = g.id LEFT JOIN Relationship r ON CAST(u.relation_type AS INTEGER) = r.id LEFT JOIN Cookingskill c ON CAST(u.cooking_skill AS INTEGER) = c.id LEFT JOIN Habits h ON CAST(u.habit AS INTEGER) = h.id LEFT JOIN Exercise e ON CAST(u.exercise AS INTEGER) = e.id LEFT JOIN Hobbies hb ON CAST(u.hobby AS INTEGER) = hb.id LEFT JOIN Smoking s ON CAST(u.smoking_opinion AS INTEGER) = s.id LEFT JOIN Kids k ON CAST(u.kids_opinion AS INTEGER) = k.id LEFT JOIN Nightlife n ON CAST(u.night_life AS INTEGER) = n.id WHERE u.id = $1', [favorite_user_id]);

        if (favoriteUserDetails.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Favorite user not found' });
        }

        // Check if the favorite relationship already exists
        const checkExistence = await pool.query('SELECT EXISTS(SELECT 1 FROM Favorites WHERE user_id = $1 AND favorite_user_id = $2)', [user_id, favorite_user_id]);
        if (!checkExistence.rows[0].exists) {
            await pool.query('INSERT INTO Favorites (user_id, favorite_user_id) VALUES ($1, $2)', [user_id, favorite_user_id]);
        }

        // Fetch details of the user added to favorites
        const addedUserDetails = favoriteUserDetails.rows[0];

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
        SELECT u.id, u.name, u.email, u.password, u.token, u.signup_type, u.images, u.device_id,
        u.deleted_status, u.block_status, u.height, u.location, u.gender, u.dob, u.latitude, u.longitude, u.verified_status, u.report_status,
        u.deleted_at, u.created_at, u.updated_at, u.last_active,
        g.gender AS interested_in_data,
        r.relation_type AS relation_type_data,
        c.cooking_skill AS cooking_skill_data,
        h.habit AS habit_data,
        e.exercise AS exercise_data,
        hb.hobby AS hobby_data,
        s.smoking_opinion AS smoking_opinion_data,
        k.kids_opinion AS kids_opinion_data,
        n.night_life AS night_life_data,
        COUNT(*) OVER() AS total_count
        FROM Users u
        INNER JOIN Favorites ON u.id = Favorites.favorite_user_id
        LEFT JOIN Gender g ON CAST(u.interested_in AS INTEGER) = g.id
        LEFT JOIN Relationship r ON CAST(u.relation_type AS INTEGER) = r.id
        LEFT JOIN Cookingskill c ON CAST(u.cooking_skill AS INTEGER) = c.id
        LEFT JOIN Habits h ON CAST(u.habit AS INTEGER) = h.id
        LEFT JOIN Exercise e ON CAST(u.exercise AS INTEGER) = e.id
        LEFT JOIN Hobbies hb ON CAST(u.hobby AS INTEGER) = hb.id
        LEFT JOIN Smoking s ON CAST(u.smoking_opinion AS INTEGER) = s.id
        LEFT JOIN Kids k ON CAST(u.kids_opinion AS INTEGER) = k.id
        LEFT JOIN Nightlife n ON CAST(u.night_life AS INTEGER) = n.id
        WHERE Favorites.user_id = $1
        AND u.deleted_status = false 
        AND u.report_status = false 
        AND u.block_status = false
        ORDER BY u.id 
        OFFSET $2
        LIMIT $3
    `;

        const favoritesResult = await pool.query(favoritesQuery, [user_id, offset, limit]);
        const favorites = favoritesResult.rows;

        // Extract the total count from the first row of the result
        const totalCount = favorites.length > 0 ? favorites[0].total_count : 0;

        const userLocationQuery = 'SELECT latitude, longitude FROM Users WHERE id = $1';
        const userLocationResult = await pool.query(userLocationQuery, [user_id]);

        if (userLocationResult.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'User location not found' });
        }

        const { latitude: userLatitude, longitude: userLongitude } = userLocationResult.rows[0];
        // Calculate distance for each user and add it to the response
        const usersWithDistance = favorites.map(user => {
            // Calculate distance using Haversine formula
            const distance = calculateDistanceBetweenUsers(user.latitude, user.longitude, userLatitude, userLongitude);

            // Add distance to user object
            return { ...user, distance };
        });

        const usersWithAge = usersWithDistance.map(user => {
            const age = calculateAgeFromDateOfBirth(user.dob);
            // Add age to user object
            return { ...user, age };
        });

        res.status(200).json({
            error: false,
            msg: 'Favorites fetched successfully',
            count: usersWithAge.length,
            total_count: totalCount,
            data: usersWithAge,
        });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({ error: true, msg: 'Internal Server Error' });
    }
};

function calculateAgeFromDateOfBirth(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Reduce age by 1 if birth month is greater than current month
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}
// Function to calculate distance using Haversine formula
function calculateDistanceBetweenUsers(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

const getFavoriteById = async (req, res) => {
    const { user_id } = req.params;
    const { favorite_id } = req.body;

    try {
        // Check if the user exists
        const userExists = await pool.query('SELECT EXISTS(SELECT 1 FROM Users WHERE id = $1)', [user_id]);
        if (!userExists.rows[0].exists) {
            return res.status(404).json({ error: true, msg: 'User not found' });
        }

        // Query to retrieve the specific favorite of the user with detailed information
        const favoriteQuery = `
        SELECT u.id, u.name, u.email, u.password, u.token, u.signup_type, u.images, u.device_id,
        u.deleted_status, u.block_status, u.height, u.location, u.gender, u.dob, u.latitude, u.longitude, u.verified_status, u.report_status,
        u.deleted_at, u.created_at, u.updated_at, u.last_active,
        g.gender AS interested_in_data,
        r.relation_type AS relation_type_data,
        c.cooking_skill AS cooking_skill_data,
        h.habit AS habit_data,
        e.exercise AS exercise_data,
        hb.hobby AS hobby_data,
        s.smoking_opinion AS smoking_opinion_data,
        k.kids_opinion AS kids_opinion_data,
        n.night_life AS night_life_data
        FROM Users u
        INNER JOIN Favorites ON u.id = Favorites.favorite_user_id
        LEFT JOIN Gender g ON CAST(u.interested_in AS INTEGER) = g.id
        LEFT JOIN Relationship r ON CAST(u.relation_type AS INTEGER) = r.id
        LEFT JOIN Cookingskill c ON CAST(u.cooking_skill AS INTEGER) = c.id
        LEFT JOIN Habits h ON CAST(u.habit AS INTEGER) = h.id
        LEFT JOIN Exercise e ON CAST(u.exercise AS INTEGER) = e.id
        LEFT JOIN Hobbies hb ON CAST(u.hobby AS INTEGER) = hb.id
        LEFT JOIN Smoking s ON CAST(u.smoking_opinion AS INTEGER) = s.id
        LEFT JOIN Kids k ON CAST(u.kids_opinion AS INTEGER) = k.id
        LEFT JOIN Nightlife n ON CAST(u.night_life AS INTEGER) = n.id
        WHERE Favorites.user_id = $1 AND Favorites.favorite_user_id = $2
        AND u.block_status = false -- Add this condition to exclude users with block_status = true
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

        // Query to retrieve all favorites with detailed information and pagination
        const favoritesQuery = `
        SELECT u.id, u.name, u.email, u.password, u.token, u.signup_type, u.images, u.device_id,
        u.deleted_status, u.block_status, u.height, u.location, u.gender, u.dob, u.latitude, u.longitude, u.verified_status, u.report_status,
        u.deleted_at, u.created_at, u.updated_at, u.last_active,
        g.gender AS interested_in_data,
        r.relation_type AS relation_type_data,
        c.cooking_skill AS cooking_skill_data,
        h.habit AS habit_data,
        e.exercise AS exercise_data,
        hb.hobby AS hobby_data,
        s.smoking_opinion AS smoking_opinion_data,
        k.kids_opinion AS kids_opinion_data,
        n.night_life AS night_life_data,
        Favorites.user_id AS favorited_by_user_id,
        COUNT(*) OVER() AS total_count
        FROM Users u
        INNER JOIN Favorites ON u.id = Favorites.favorite_user_id
        LEFT JOIN Gender g ON CAST(u.interested_in AS INTEGER) = g.id
        LEFT JOIN Relationship r ON CAST(u.relation_type AS INTEGER) = r.id
        LEFT JOIN Cookingskill c ON CAST(u.cooking_skill AS INTEGER) = c.id
        LEFT JOIN Habits h ON CAST(u.habit AS INTEGER) = h.id
        LEFT JOIN Exercise e ON CAST(u.exercise AS INTEGER) = e.id
        LEFT JOIN Hobbies hb ON CAST(u.hobby AS INTEGER) = hb.id
        LEFT JOIN Smoking s ON CAST(u.smoking_opinion AS INTEGER) = s.id
        LEFT JOIN Kids k ON CAST(u.kids_opinion AS INTEGER) = k.id
        LEFT JOIN Nightlife n ON CAST(u.night_life AS INTEGER) = n.id
        WHERE u.deleted_status = false 
        AND u.report_status = false 
        AND u.block_status = false
        ORDER BY Favorites.user_id, u.id
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
    const { user_id, favorite_user_id } = req.params;

    try {
        // Check if the user exists
        const userExists = await pool.query('SELECT EXISTS(SELECT 1 FROM Users WHERE id = $1)', [user_id]);
        if (!userExists.rows[0].exists) {
            return res.status(404).json({ error: true, msg: 'User not found' });
        }

        // Check if the favorite user exists
        const favoriteUserExists = await pool.query('SELECT EXISTS(SELECT 1 FROM Users WHERE id = $1)', [favorite_user_id]);
        if (!favoriteUserExists.rows[0].exists) {
            return res.status(404).json({ error: true, msg: 'Favorite user not found' });
        }

        // Check if the favorite exists in the user's favorites list
        const favoriteExists = await pool.query('SELECT EXISTS(SELECT 1 FROM Favorites WHERE user_id = $1 AND favorite_user_id = $2)', [user_id, favorite_user_id]);
        if (!favoriteExists.rows[0].exists) {
            return res.status(404).json({ error: true, msg: 'Favorite not found in user favorites' });
        }

        // Remove the favorite from the user's favorites list
        await pool.query('DELETE FROM Favorites WHERE user_id = $1 AND favorite_user_id = $2', [user_id, favorite_user_id]);

        res.status(200).json({ error: false, msg: 'Favorite removed successfully' });
    } catch (error) {
        console.error('Error removing favorite:', error);
        res.status(500).json({ error: true, msg: 'Internal Server Error' });
    }
};

const checkFavoriteStatus = async (req, res) => {

    const { user_id, favorite_user_id } = req.body;

    try {
        const queryExistence = 'SELECT EXISTS (SELECT 1 FROM Favorites WHERE user_id = $1 AND favorite_user_id = $2)';
        const resultExistence = await pool.query(queryExistence, [user_id, favorite_user_id]);

        const exists = resultExistence.rows[0].exists;

        if (exists) {
            const queryDetails = `
                SELECT u1.name as user_name, u1.email as user_email,
                       u2.name as favorite_user_name, u2.email as favorite_user_email
                FROM Favorites f
                JOIN Users u1 ON f.user_id = u1.id
                JOIN Users u2 ON f.favorite_user_id = u2.id
                WHERE f.user_id = $1 AND f.favorite_user_id = $2
                    AND u1.deleted_status = false 
                    AND u1.report_status = false 
                    AND u1.block_status = false
                    AND u2.deleted_status = false 
                    AND u2.report_status = false 
                    AND u2.block_status = false
            `;
            const resultDetails = await pool.query(queryDetails, [user_id, favorite_user_id]);

            // userDetails
            if (resultDetails.rows.length > 0) {
                const userDetails = resultDetails.rows[0]; // Assuming only one row is returned
                res.json({ error: false, savedStatus: true });
            } else {
                res.json({ error: true, savedStatus: false });
            }
        } else {
            res.json({ error: true, savedStatus: false });
        }
    } catch (error) {
        console.error('Error checking favorites:', error);
        res.status(500).json({ msg: 'Internal server error', error: false });
    }
}

const getUsersWithSameFavorites = async (req, res) => {
    const { user_id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
        // Check if the user exists
        const userExists = await pool.query('SELECT EXISTS(SELECT 1 FROM Users WHERE id = $1)', [user_id]);
        if (!userExists.rows[0].exists) {
            return res.status(404).json({ error: true, msg: 'User not found' });
        }

        // Check if the user exists in favorites
        const userInFavorites = await pool.query('SELECT EXISTS(SELECT 1 FROM Favorites WHERE user_id = $1)', [user_id]);
        const savedStatus = userInFavorites.rows[0].exists;

        // Calculate the OFFSET based on the page and limit
        const offset = (page - 1) * limit;

        // Query to retrieve users who have added the provided user to their favorites with pagination
        const favoriteUsersQuery = `
            SELECT 
                u.id, u.name, u.email, u.password, u.token, u.signup_type, u.images, u.device_id,
                u.deleted_status, u.block_status, u.height, u.location, u.gender, u.dob, u.latitude, u.longitude,
                u.verified_status, u.report_status, u.online_status, u.subscription_status, u.created_at, u.updated_at, u.deleted_at,
                g.gender AS interested_in_data,
                r.relation_type AS relation_type_data,
                c.cooking_skill AS cooking_skill_data,
                h.habit AS habit_data,
                e.exercise AS exercise_data,
                hb.hobby AS hobby_data,
                s.smoking_opinion AS smoking_opinion_data,
                k.kids_opinion AS kids_opinion_data,
                n.night_life AS night_life_data,
                DATE_PART('year', AGE(CURRENT_DATE, TO_DATE(u.dob, 'YYYY-MM-DD'))) AS age,
                (
                    6371 * 
                    acos(
                        cos(radians($1)) * cos(radians(u.latitude)) * cos(radians(u.longitude) - radians($2)) +
                        sin(radians($1)) * sin(radians(u.latitude))
                    )
                ) AS distance,
                $3 AS saved_status
            FROM Users u
            LEFT JOIN Gender g ON u.interested_in::varchar = g.id::varchar
            LEFT JOIN Relationship r ON u.relation_type::varchar = r.id::varchar
            LEFT JOIN Cookingskill c ON u.cooking_skill::varchar = c.id::varchar
            LEFT JOIN Habits h ON u.habit::varchar = h.id::varchar
            LEFT JOIN Exercise e ON u.exercise::varchar = e.id::varchar
            LEFT JOIN Hobbies hb ON u.hobby::varchar = hb.id::varchar
            LEFT JOIN Smoking s ON u.smoking_opinion::varchar = s.id::varchar
            LEFT JOIN Kids k ON u.kids_opinion::varchar = k.id::varchar
            LEFT JOIN Nightlife n ON u.night_life::varchar = n.id::varchar
            INNER JOIN Favorites f ON u.id = f.user_id
            WHERE f.favorite_user_id = $4
            AND u.id != $4
             AND u.deleted_status = false
                AND u.block_status = false
                AND u.report_status = false
            ORDER BY distance
            OFFSET $5
            LIMIT $6
        `;

        const user = await pool.query('SELECT latitude, longitude FROM Users WHERE id = $1', [user_id]);
        const userLatitude = user.rows[0].latitude;
        const userLongitude = user.rows[0].longitude;

        const favoriteUsersResult = await pool.query(favoriteUsersQuery, [userLatitude, userLongitude, savedStatus, user_id, offset, limit]);
        const favoriteUsers = favoriteUsersResult.rows;

        // Get total count of users who have added the provided user to their favorites
        const totalCountQuery = 'SELECT COUNT(*) AS total_count FROM Users u INNER JOIN Favorites f ON u.id = f.user_id WHERE f.favorite_user_id = $1';
        const totalCountResult = await pool.query(totalCountQuery, [user_id]);
        const totalCount = parseInt(totalCountResult.rows[0].total_count);

        res.status(200).json({
            error: false,
            msg: 'Favorite users retrieved successfully',
            total_count: favoriteUsers.length,
            data: favoriteUsers,
        });
    } catch (error) {
        console.error('Error retrieving favorite users:', error);
        res.status(500).json({ error: true, msg: 'Internal Server Error' });
    }
};

module.exports = { getUsersWithSameFavorites, checkFavoriteStatus, getFavoriteById, addToFavorites, getFavoritesbyuserID, getAllFavorites, removeFavorite };