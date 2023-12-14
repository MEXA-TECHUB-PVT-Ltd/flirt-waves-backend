const pool = require("../config/dbconfig")

const addhobby = async (req, res) => {
    try {
        const { hobby, image } = req.body; // Extract 'hobby' and 'image' from request body

        const newHobbies = await pool.query(
            'INSERT INTO Hobbies (hobby, image) VALUES ($1, $2) RETURNING *',
            [hobby, image] // Include both 'hobby' and 'image' in the query parameters
        );

        res.json({
            msg: 'Hobby added successfully',
            error: false,
            data: newHobbies.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const updatehobby = async (req, res) => {
    try {
        const { id } = req.params; // Get the ID from the URL parameters
        const { hobby, image } = req.body; // Extract 'hobby' and 'image' from request body

        const updatedHobbies = await pool.query(
            'UPDATE Hobbies SET hobby = $1, image = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
            [hobby, image, id] // Include 'hobby', 'image', and 'id' in the query parameters
        );

        if (updatedHobbies.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Hobby not found' });
        }

        res.json({
            msg: 'Hobby updated successfully',
            error: false,
            data: updatedHobbies.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const deletehobby = async (req, res) => {
    try {
        const { id } = req.params; // Get the ID from the URL parameters

        const deletedHobbies = await pool.query(
            'DELETE FROM Hobbies WHERE id = $1 RETURNING *',
            [id]
        );

        if (deletedHobbies.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Hobby not found' });
        }

        res.json({
            msg: 'Hobby deleted successfully',
            error: false,
            data: deletedHobbies.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const getAllHobbiess = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    // Calculate the OFFSET based on the page and limit
    const offset = (page - 1) * limit;

    try {
        let query = `
        SELECT *
        FROM Hobbies
      `;

        // Check if pagination parameters are provided
        if (page && limit) {
            query += `
          OFFSET ${offset}
          LIMIT ${limit}
        `;
        }

        const result = await pool.query(query);

        const Hobbiess = result.rows;
        return res.status(200).json({
            msg: 'Hobbies fetched successfully',
            error: false,
            count: Hobbiess.length,
            data: Hobbiess,
        });
    } catch (error) {
        console.error('Error fetching Hobbiess:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
};

const getHobbyById = async (req, res) => {
    const hobbyId = req.params.id; // Assuming the ID is passed in the request parameters

    try {
        const query = `
            SELECT *
            FROM Hobbies
            WHERE id = $1
        `;

        const result = await pool.query(query, [hobbyId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Hobby not found', error: true });
        }

        const hobby = result.rows[0];
        return res.status(200).json({
            msg: 'Hobby fetched successfully',
            error: false,
            data: hobby,
        });
    } catch (error) {
        console.error('Error fetching Hobby:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
};

const getusersofhobby = async (req, res) => {
    const { hobby_id, user_id } = req.body;
    const { page, limit } = req.query;

    if (!hobby_id) {
        return res.status(400).json({ error: true, msg: 'Hobby ID is missing in the request body' });
    }

    try {
        // Check if the ID exists in the Users table
        const userExistQuery = 'SELECT COUNT(*) FROM Users WHERE hobby = $1 AND deleted_status = false AND block_status = false AND report_status = false';
        const userExistResult = await pool.query(userExistQuery, [hobby_id]);
        const totalCount = parseInt(userExistResult.rows[0].count);

        if (totalCount === 0) {
            return res.status(404).json({ error: true, msg: 'No users found for this hobby' });
        }

        let usersData;
        let query;
        const params = [hobby_id];

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
          EXTRACT(YEAR FROM AGE(TO_DATE(dob, 'YYYY-MM-DD'))) AS age
          FROM Users
          WHERE hobby = $1
          AND id != $5 -- Exclude the provided user ID
          AND report_status = false
          AND block_status = false
          AND deleted_status = false
        `;

            params.push(user_id, user_id, user_id, user_id);
        } else {
            query = `
          SELECT *,
          EXTRACT(YEAR FROM AGE(TO_DATE(dob, 'YYYY-MM-DD'))) AS age
          FROM Users
          WHERE hobby = $1
          AND report_status = false
          AND block_status = false
          AND deleted_status = false
        `;
        }

        if (page && limit) {
            const offset = (page - 1) * limit;
            query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(limit, offset);
        }

        const usersResult = await pool.query(query, params);
        usersData = usersResult.rows;

        // Fetch hobby details for the provided hobby_id
        const hobbyQuery = 'SELECT * FROM Hobbies WHERE id = $1';
        const hobbyResult = await pool.query(hobbyQuery, [hobby_id]);
        const hobbyData = hobbyResult.rows;

        const response = {
            error: false,
            count: usersData.length,
            users: usersData,
            hobby_details: hobbyData,
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

const filterHobbies = async (req, res) => {
    const { user_id } = req.params;
    const { hobby_id } = req.body;

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

        // Check if the hobby exists
        const hobbyQuery = 'SELECT * FROM Hobbies WHERE id = $1';
        const hobbyResult = await pool.query(hobbyQuery, [hobby_id]);

        if (hobbyResult.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Hobby not found' });
        }

        // Both user and hobby exist, return details
        const userData = userResult.rows[0];
        const hobbyData = hobbyResult.rows[0];

        res.status(200).json({
            error: false,
            msg: 'User and Hobby details fetched successfully',
            user: userData,
            hobby: hobbyData,
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

module.exports = { filterHobbies, addhobby, updatehobby, deletehobby, getAllHobbiess, getHobbyById, getusersofhobby };