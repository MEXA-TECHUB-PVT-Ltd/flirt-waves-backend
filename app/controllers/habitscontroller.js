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

module.exports = { addhabits, updateHabits, deleteHabits, getAllHabits,getusersofhabit };