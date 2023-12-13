const pool = require("../config/dbconfig")

const addhabits = async (req, res) => {
    try {
        const { habit, image } = req.body; // Extract 'habit' and 'image' from request body
    
        const newHabit = await pool.query(
          'INSERT INTO Habits (habit, image) VALUES ($1, $2) RETURNING *',
          [habit, image] // Include both 'habit' and 'image' in the query parameters
        );
    
        res.json({
          msg: 'Habit added successfully',
          error: false,
          data: newHabit.rows[0],
        });
      } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
      }
};

const updateHabits = async (req, res) => {
    try {
        const { id } = req.params; // Get the ID from the URL parameters
        const { habit, image } = req.body; // Extract 'habit' and 'image' from request body
    
        const updatedHabits = await pool.query(
          'UPDATE Habits SET habit = $1, image = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
          [habit, image, id] // Include 'habit', 'image', and 'id' in the query parameters
        );
    
        if (updatedHabits.rows.length === 0) {
          return res.status(404).json({ error: true, msg: 'Habit not found' });
        }
    
        res.json({
          msg: 'Habit updated successfully',
          error: false,
          data: updatedHabits.rows[0],
        });
      } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
      }
};

const deleteHabits = async (req, res) => {
    try {
        const { id } = req.params; // Get the ID from the URL parameters

        const deletedHabits = await pool.query(
            'DELETE FROM Habits WHERE id = $1 RETURNING *',
            [id]
        );

        if (deletedHabits.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Habit not found' });
        }

        res.json({
            msg: 'Deleted successfully',
            error: false,
            data: deletedHabits.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const getAllHabits = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    // Calculate the OFFSET based on the page and limit
    const offset = (page - 1) * limit;

    try {
        let query = `
        SELECT *
        FROM Habits
      `;

        // Check if pagination parameters are provided
        if (page && limit) {
            query += `
          OFFSET ${offset}
          LIMIT ${limit}
        `;
        }

        const result = await pool.query(query);

        const Habits = result.rows;
        return res.status(200).json({
            msg: 'All habits fetched successfully',
            error: false,
            count: Habits.length,
            data: Habits,
        });
    } catch (error) {
        console.error('Error fetching habit:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
};

const getusersofhabit = async (req, res) => {
    const { habit_id } = req.body;
    const { page, limit } = req.query;

    if (!habit_id) {
        return res.status(400).json({ error: true, msg: 'Habit ID is missing in the request body' });
    }

    try {
        // Check if there are users associated with the habit_id
        const usersExistQuery = 'SELECT COUNT(*) FROM Users WHERE habit = $1 AND deleted_status = false AND block_status = false AND report_status = false';
        const usersExistResult = await pool.query(usersExistQuery, [habit_id]);
        const totalCount = parseInt(usersExistResult.rows[0].count);

        if (totalCount === 0) {
            const habitQuery = 'SELECT * FROM Habits WHERE id = $1';
            const habitResult = await pool.query(habitQuery, [habit_id]);
            const habitData = habitResult.rows;

            const response = {
                error: false,
                users: [],
                habit_details: habitData,
            };

            return res.status(200).json(response);
        }

        let usersData;
        // Fetch users associated with the habit_id with pagination and additional conditions
        if (page && limit) {
            const offset = (page - 1) * limit;
            const usersQuery = `
                SELECT * FROM Users 
                WHERE habit = $1 
                AND deleted_status = false 
                AND block_status = false 
                AND report_status = false 
                LIMIT $2 OFFSET $3
            `;
            const usersResult = await pool.query(usersQuery, [habit_id, limit, offset]);
            usersData = usersResult.rows;
        } else {
            const allUsersQuery = `
                SELECT * FROM Users 
                WHERE habit = $1 
                AND deleted_status = false 
                AND block_status = false 
                AND report_status = false
            `;
            const allUsersResult = await pool.query(allUsersQuery, [habit_id]);
            usersData = allUsersResult.rows;
        }

        // Fetch habit details for the provided habit_id
        const habitQuery = 'SELECT * FROM Habits WHERE id = $1';
        const habitResult = await pool.query(habitQuery, [habit_id]);
        const habitData = habitResult.rows;

        const response = {
            error: false,
            count: totalCount,
            users: usersData,
            habit_details: habitData,
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
    
};

const filterHabits = async (req, res) => {
    const { user_id } = req.params;
    const { habit_id } = req.body;

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

        // Check if the habit exists
        const habitQuery = 'SELECT * FROM Habits WHERE id = $1';
        const habitResult = await pool.query(habitQuery, [habit_id]);

        if (habitResult.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Habit not found' });
        }

        // Both user and habit exist, return details
        const userData = userResult.rows[0];
        const habitData = habitResult.rows[0];

        res.status(200).json({
            error: false,
            msg: 'User and Habit details fetched successfully',
            user: userData,
            habit: habitData,
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

module.exports = { filterHabits, addhabits, updateHabits, deleteHabits, getAllHabits, getusersofhabit };