const pool = require("../config/dbconfig")

const addhobby = async (req, res) => {
    try {
        const { hobby } = req.body;
        const newHobbies = await pool.query(
            'INSERT INTO Hobbies (hobby) VALUES ($1) RETURNING *',
            [hobby]
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
        const { hobby } = req.body;

        const updatedHobbies = await pool.query(
            'UPDATE Hobbies SET hobby = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [hobby, id]
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
    const { hobby_id } = req.body;

    if (!hobby_id) {
        return res.status(400).json({ error: true, msg: 'Hobby ID is missing in the request body' });
    }

    try {
        // Check if the ID exists in the Users table
        const userExistQuery = 'SELECT * FROM Users WHERE id = $1';
        const userExistResult = await pool.query(userExistQuery, [hobby_id]);

        if (userExistResult.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'ID does not exist' });
        }

        // Fetch users associated with the hobby_id
        const usersQuery = 'SELECT * FROM Users WHERE hobby = $1';
        const usersResult = await pool.query(usersQuery, [hobby_id]);

        // Fetch hobby details for the provided hobby_id
        const hobbyQuery = 'SELECT * FROM Hobbies WHERE id = $1';
        const hobbyResult = await pool.query(hobbyQuery, [hobby_id]);

        const usersData = usersResult.rows;
        const hobbyData = hobbyResult.rows;

        const response = {
            error: false,
            users: usersData,
            hobby_details: hobbyData,
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

module.exports = { addhobby, updatehobby, deletehobby, getAllHobbiess, getHobbyById, getusersofhobby };