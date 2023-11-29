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

const getusersofexercise = async (req, res) => {
    const { exercise_id } = req.body;

    if (!exercise_id) {
        return res.status(400).json({ error: true, msg: 'Exercise ID is missing in the request body' });
    }

    try {
        // Check if the ID exists in the Users table
        const userExistQuery = 'SELECT * FROM Users WHERE id = $1';
        const userExistResult = await pool.query(userExistQuery, [exercise_id]);

        if (userExistResult.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'ID does not exist' });
        }

        // Fetch users associated with the exercise_id
        const usersQuery = 'SELECT * FROM Users WHERE exercise = $1';
        const usersResult = await pool.query(usersQuery, [exercise_id]);

        // Fetch exercise details for the provided exercise_id
        const exerciseQuery = 'SELECT * FROM Exercise WHERE id = $1';
        const exerciseResult = await pool.query(exerciseQuery, [exercise_id]);

        const usersData = usersResult.rows;
        const exerciseData = exerciseResult.rows;

        const response = {
            error: false,
            users: usersData,
            exercise_details: exerciseData,
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

module.exports = { addexercise, updateexercise, deleteexercise,getAllexercises,getusersofexercise };