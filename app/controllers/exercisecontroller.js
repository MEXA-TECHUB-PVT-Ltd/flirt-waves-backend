const pool = require("../config/dbconfig")

const addexercise = async (req, res) => {
    try {
        const { exercise, image } = req.body; // Extract 'exercise' and 'image' from request body

        const newExercise = await pool.query(
            'INSERT INTO Exercise (exercise, image) VALUES ($1, $2) RETURNING *',
            [exercise, image] // Include both 'exercise' and 'image' in the query parameters
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
        const { exercise, image } = req.body; // Extract 'exercise' and 'image' from request body
    
        const updatedexercise = await pool.query(
          'UPDATE Exercise SET exercise = $1, image = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
          [exercise, image, id] // Include 'exercise', 'image', and 'id' in the query parameters
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

const filterExercise = async (req, res) => {
    const { user_id } = req.params;
    const { exercise_id } = req.body;

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

        // Check if the exercise exists
        const exerciseQuery = 'SELECT * FROM Exercise WHERE id = $1';
        const exerciseResult = await pool.query(exerciseQuery, [exercise_id]);

        if (exerciseResult.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Exercise not found' });
        }

        // Both user and exercise exist, return details
        const userData = userResult.rows[0];
        const exerciseData = exerciseResult.rows[0];

        res.status(200).json({
            error: false,
            msg: 'User and Exercise details fetched successfully',
            user: userData,
            exercise: exerciseData,
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

module.exports = { filterExercise, addexercise, updateexercise, deleteexercise, getAllexercises, getusersofexercise };