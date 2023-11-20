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

module.exports = { addhabits, updateHabits, deleteHabits, getAllHabits };