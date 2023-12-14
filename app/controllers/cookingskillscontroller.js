const pool = require("../config/dbconfig")

const addCookingskill = async (req, res) => {
    try {
        const { cooking_skill, image } = req.body; // Extract 'cooking_skill' and 'image' from request body
    
        const newCookingskill = await pool.query(
          'INSERT INTO Cookingskill (cooking_skill, image) VALUES ($1, $2) RETURNING *',
          [cooking_skill, image] // Include both 'cooking_skill' and 'image' in the query parameters
        );
    
        res.json({
          msg: 'Cooking skill added successfully',
          error: false,
          data: newCookingskill.rows[0],
        });
      } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
      }
};

const updatecookingskill = async (req, res) => {
    try {
        const { id } = req.params; // Get the ID from the URL parameters
        const { cooking_skill, image } = req.body; // Extract 'cooking_skill' and 'image' from request body
    
        const updatedcookingskill = await pool.query(
          'UPDATE Cookingskill SET cooking_skill = $1, image = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
          [cooking_skill, image, id] // Include 'cooking_skill', 'image', and 'id' in the query parameters
        );
    
        if (updatedcookingskill.rows.length === 0) {
          return res.status(404).json({ error: true, msg: 'Cooking skill not found' });
        }
    
        res.json({
          msg: 'Cooking skill updated successfully',
          error: false,
          data: updatedcookingskill.rows[0],
        });
      } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
      }
};

const deleteCookingskill = async (req, res) => {
    try {
        const { id } = req.params; // Get the ID from the URL parameters

        const deletedCookingskill = await pool.query(
            'DELETE FROM Cookingskill WHERE id = $1 RETURNING *',
            [id]
        );

        if (deletedCookingskill.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Cokking skill not found' });
        }

        res.json({
            msg: 'Deleted successfully',
            error: false,
            data: deletedCookingskill.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const getAllcookingskill = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    // Calculate the OFFSET based on the page and limit
    const offset = (page - 1) * limit;

    try {
        let query = `
        SELECT *
        FROM Cookingskill
      `;

        // Check if pagination parameters are provided
        if (page && limit) {
            query += `
          OFFSET ${offset}
          LIMIT ${limit}
        `;
        }

        const result = await pool.query(query);

        const cookingskill = result.rows;
        return res.status(200).json({
            msg: 'Fetched successfully',
            error: false,
            count: cookingskill.length,
            data: cookingskill,
        });
    } catch (error) {
        console.error('Error fetching cooking skill:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
};

const getusersofcookingskill = async (req, res) => {
    const { cooking_skill_id } = req.body;
    const { page, limit } = req.query;

    if (!cooking_skill_id) {
        return res.status(400).json({ error: true, msg: 'Cooking skill ID is missing in the request body' });
    }

    let query = 'SELECT COUNT(*) FROM Users WHERE cooking_skill = $1 AND deleted_status = false AND block_status = false AND report_status = false';
    const countResult = await pool.query(query, [cooking_skill_id]);
    const totalCount = countResult.rows[0].count;

    if (totalCount === 0) {
        const cookingSkillQuery = 'SELECT * FROM Cookingskill WHERE id = $1';
        const cookingSkillResult = await pool.query(cookingSkillQuery, [cooking_skill_id]);
        const cookingSkillData = cookingSkillResult.rows;

        const response = {
            error: false,
            users: [],
            cooking_skill_details: cookingSkillData,
        };

        return res.status(200).json(response);
    }

    let usersQuery = `
        SELECT * FROM Users
        WHERE cooking_skill = $1 AND deleted_status = false AND block_status = false AND report_status = false
    `;

    const params = [cooking_skill_id];

    if (page && limit) {
        const offset = (page - 1) * limit;
        usersQuery += ` OFFSET $2 LIMIT $3`;
        params.push(offset, limit);
    }

    try {
        const usersResult = await pool.query(usersQuery, params);
        const userData = usersResult.rows;

        const response = {
            error: false,
            count: totalCount,
            users: userData,
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
    
};

const filtercookingskill = async (req, res) => {
    const { user_id } = req.params;
    const { cooking_skill_id } = req.body;

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

        // Check if the cooking skill exists
        const cookingSkillQuery = 'SELECT * FROM Cookingskill WHERE id = $1';
        const cookingSkillResult = await pool.query(cookingSkillQuery, [cooking_skill_id]);

        if (cookingSkillResult.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Cooking skill not found' });
        }

        // Both user and cooking skill exist, return details
        const userData = userResult.rows[0];
        const cookingSkillData = cookingSkillResult.rows[0];

        res.status(200).json({
            error: false,
            msg: 'User and Cooking skill details fetched successfully',
            user: userData,
            cooking_skill: cookingSkillData,
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
    
};

module.exports = { filtercookingskill,addCookingskill, updatecookingskill, deleteCookingskill, getAllcookingskill, getusersofcookingskill };