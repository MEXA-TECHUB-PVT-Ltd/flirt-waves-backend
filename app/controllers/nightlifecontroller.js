const pool = require("../config/dbconfig")

const addnightlife = async (req, res) => {
    try {
        const { night_life, image } = req.body; // Extract 'night_life' and 'image' from request body

        const newNightlife = await pool.query(
            'INSERT INTO Nightlife (night_life, image) VALUES ($1, $2) RETURNING *',
            [night_life, image] // Include both 'night_life' and 'image' in the query parameters
        );

        res.json({
            msg: 'Night life added successfully',
            error: false,
            data: newNightlife.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const updatenightlife = async (req, res) => {
    try {
        const { id } = req.params; // Get the ID from the URL parameters
        const { night_life, image } = req.body; // Extract 'night_life' and 'image' from request body

        const updatedNightlife = await pool.query(
            'UPDATE Nightlife SET night_life = $1, image = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
            [night_life, image, id] // Include 'night_life', 'image', and 'id' in the query parameters
        );

        if (updatedNightlife.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Night life not found' });
        }

        res.json({
            msg: 'Night life updated successfully',
            error: false,
            data: updatedNightlife.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const deletenightlife = async (req, res) => {
    try {
        const { id } = req.params; // Get the ID from the URL parameters

        const deletedNightlife = await pool.query(
            'DELETE FROM Nightlife WHERE id = $1 RETURNING *',
            [id]
        );

        if (deletedNightlife.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Night life not found' });
        }

        res.json({
            msg: 'Night life deleted successfully',
            error: false,
            data: deletedNightlife.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const getAllNightlifes = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    // Calculate the OFFSET based on the page and limit
    const offset = (page - 1) * limit;

    try {
        let query = `
        SELECT *
        FROM Nightlife
      `;

        // Check if pagination parameters are provided
        if (page && limit) {
            query += `
          OFFSET ${offset}
          LIMIT ${limit}
        `;
        }

        const result = await pool.query(query);

        const Nightlifes = result.rows;
        return res.status(200).json({
            msg: 'All nightlifes fetched successfully',
            error: false,
            count: Nightlifes.length,
            data: Nightlifes,
        });
    } catch (error) {
        console.error('Error fetching Nightlifes:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
};

const getNightlifeByID = async (req, res) => {
    const nightlifeID = req.params.id; // Assuming the ID is passed in the request parameters

    try {
        const query = `
            SELECT *
            FROM Nightlife
            WHERE id = $1
        `;

        const result = await pool.query(query, [nightlifeID]);

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Night life not found', error: true });
        }

        const night_life = result.rows[0];
        return res.status(200).json({
            msg: 'Night life fetched successfully',
            error: false,
            data: night_life,
        });
    } catch (error) {
        console.error('Error fetching night life:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
};

const getusersofnightlifeopinion = async (req, res) => {
    const { nightlife_id, user_id } = req.body;
    const { page, limit } = req.query;

    if (!nightlife_id) {
        return res.status(400).json({ error: true, msg: 'Nightlife ID is missing in the request body' });
    }

    try {
        // Check if the ID exists in the Users table
        const userExistQuery = 'SELECT COUNT(*) FROM Users WHERE night_life = $1 AND deleted_status = false AND block_status = false AND report_status = false';
        const userExistResult = await pool.query(userExistQuery, [nightlife_id]);
        const totalCount = parseInt(userExistResult.rows[0].count);

        if (totalCount === 0) {
            return res.status(404).json({ error: true, msg: 'No users found for this nightlife opinion' });
        }

        let usersData;
        let query;
        const params = [nightlife_id];

        if (user_id) {
            // Check if the provided user ID exists in the Users table
            const userCheckQuery = 'SELECT * FROM Users WHERE id = $1 LIMIT 1';
            const userCheckResult = await pool.query(userCheckQuery, [user_id]);

            if (userCheckResult.rows.length === 0) {
                return res.status(404).json({ error: true, msg: 'User ID does not exist in the database' });
            }

            query = `
                SELECT *,
                ( 6371 * acos( cos( radians($2) ) * cos( radians( latitude ) )
                * cos( radians( longitude ) - radians($3) ) + sin( radians($4) )
                * sin( radians( latitude ) ) ) ) AS distance,
                EXTRACT(YEAR FROM AGE(TO_DATE(dob, 'YYYY-MM-DD'))) AS age,
                EXISTS (
                    SELECT 1 FROM Favorites 
                    WHERE (user_id = $5 AND favorite_user_id = Users.id) 
                       OR (user_id = Users.id AND favorite_user_id = $5)
                ) AS saved_status
                FROM Users
                WHERE night_life = $1
                AND id != $6 -- Exclude the provided user ID
                AND report_status = false
                AND block_status = false
                AND deleted_status = false
                AND id != ${user_id}
            `;

            params.push(user_id, user_id, user_id, user_id, user_id);
        } else {
            query = `
                SELECT *,
                EXTRACT(YEAR FROM AGE(TO_DATE(dob, 'YYYY-MM-DD'))) AS age
                FROM Users
                WHERE night_life = $1
                AND report_status = false
                AND block_status = false
                AND deleted_status = false
                AND id != ${user_id}
            `;
        }

        if (page && limit) {
            const offset = (page - 1) * limit;
            query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(limit, offset);
        }

        const usersResult = await pool.query(query, params);
        usersData = usersResult.rows;

        // Fetch nightlife opinion details for the provided nightlife_id
        const nightlifeQuery = 'SELECT * FROM Nightlife WHERE id = $1';
        const nightlifeResult = await pool.query(nightlifeQuery, [nightlife_id]);
        const nightlifeData = nightlifeResult.rows;

        const response = {
            error: false,
            count: usersData.length,
            users: usersData,
            nightlife_opinion_details: nightlifeData,
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

const filterNightlife = async (req, res) => {
    const { user_id } = req.params;
    const { nightlife_id } = req.body;

    try {
        // Check if the user exists
        const userQuery = `
        SELECT u.id, u.name, u.email, u.password, u.token, u.signup_type, u.images, u.device_id,
    u.deleted_status, u.block_status, u.height, u.location,u.latitude, u.longitude,u.gender, u.verified_status, u.report_status,
    u.online_status,u.subscription_status,u.created_at, u.updated_at, u.deleted_at,
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
LEFT JOIN Gender g ON u.interested_in::varchar = g.id::varchar
LEFT JOIN Relationship r ON u.relation_type::varchar = r.id::varchar
LEFT JOIN Cookingskill c ON u.cooking_skill::varchar = c.id::varchar
LEFT JOIN Habits h ON u.habit::varchar = h.id::varchar
LEFT JOIN Exercise e ON u.exercise::varchar = e.id::varchar
LEFT JOIN Hobbies hb ON u.hobby::varchar = hb.id::varchar
LEFT JOIN Smoking s ON u.smoking_opinion::varchar = s.id::varchar
LEFT JOIN Kids k ON u.kids_opinion::varchar = k.id::varchar
LEFT JOIN Nightlife n ON u.night_life::varchar = n.id::varchar
WHERE u.id = $1 AND u.deleted_status = false
        `;

        const userResult = await pool.query(userQuery, [user_id]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'User not found' });
        }

        // Check if the nightlife exists
        const nightlifeQuery = 'SELECT * FROM Nightlife WHERE id = $1';
        const nightlifeResult = await pool.query(nightlifeQuery, [nightlife_id]);

        if (nightlifeResult.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Nightlife not found' });
        }

        // Both user and nightlife exist, return details
        const userData = userResult.rows[0];
        const nightlifeData = nightlifeResult.rows[0];

        res.status(200).json({
            error: false,
            msg: 'User and Nightlife details fetched successfully',
            user: userData,
            nightlife: nightlifeData,
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

module.exports = { filterNightlife, addnightlife, updatenightlife, deletenightlife, getAllNightlifes, getNightlifeByID, getusersofnightlifeopinion };