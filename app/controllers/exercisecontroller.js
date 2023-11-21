const pool = require("../config/dbconfig")

const addexercise = async (req, res) => {
    try {
        const { exercise } = req.body;
        const newExercise = await pool.query(
            'INSERT INTO Exercise (exercise) VALUES ($1) RETURNING *',
            [exercise]
        );
        res.json({
            msg: 'Exercise added successfully',
            error: false,
            data: newExercise.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const updateexercise = async (req, res) => {
    try {
        const { id } = req.params; // Get the ID from the URL parameters
        const { exercise } = req.body;

        const updatedexercise = await pool.query(
            'UPDATE Exercise SET exercise = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [exercise, id]
        );

        if (updatedexercise.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Exercise not found' });
        }

        res.json({
            msg: 'Exercise updated successfully',
            error: false,
            data: updatedexercise.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const deleteexercise = async (req, res) => {
    try {
        const { id } = req.params; // Get the ID from the URL parameters

        const deletedexercise = await pool.query(
            'DELETE FROM exercise WHERE id = $1 RETURNING *',
            [id]
        );

        if (deletedexercise.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Exercise not found' });
        }

        res.json({
            msg: 'Exercise deleted successfully',
            error: false,
            data: deletedexercise.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const getAllexercises = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    // Calculate the OFFSET based on the page and limit
    const offset = (page - 1) * limit;

    try {
        let query = `
        SELECT *
        FROM exercise
      `;

        // Check if pagination parameters are provided
        if (page && limit) {
            query += `
          OFFSET ${offset}
          LIMIT ${limit}
        `;
        }

        const result = await pool.query(query);

        const exercises = result.rows;
        return res.status(200).json({
            msg: 'Exercises fetched successfully',
            error: false,
            count: exercises.length,
            data: exercises,
        });
    } catch (error) {
        console.error('Error fetching exercises:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
};

module.exports = { addexercise, updateexercise, deleteexercise,getAllexercises };