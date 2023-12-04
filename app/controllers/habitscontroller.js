const pool = require("../config/dbconfig")

const addhabits = async (req, res) => {
    try {
        const { habit } = req.body;
        const newHabit = await pool.query(
            'INSERT INTO Habits (habit) VALUES ($1) RETURNING *',
            [habit]
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
        const { habit } = req.body;

        const updatedHabits = await pool.query(
            'UPDATE Habits SET habit = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [habit, id]
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

    if (!habit_id) {
        return res.status(400).json({ error: true, msg: 'Habit ID is missing in the request body' });
    }

    try {
        // Check if the ID exists in the Users table
        const userExistQuery = 'SELECT * FROM Users WHERE id = $1';
        const userExistResult = await pool.query(userExistQuery, [habit_id]);

        if (userExistResult.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'ID does not exist' });
        }

        // Fetch users associated with the habit_id
        const usersQuery = 'SELECT * FROM Users WHERE habit = $1';
        const usersResult = await pool.query(usersQuery, [habit_id]);

        // Fetch habit details for the provided habit_id
        const habitQuery = 'SELECT * FROM Habits WHERE id = $1';
        const habitResult = await pool.query(habitQuery, [habit_id]);

        const usersData = usersResult.rows;
        const habitData = habitResult.rows;

        const response = {
            error: false,
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