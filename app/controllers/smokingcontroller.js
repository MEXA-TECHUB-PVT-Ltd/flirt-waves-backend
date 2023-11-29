const pool = require("../config/dbconfig")

const addsmokingopinion = async (req, res) => {
    try {
        const { smoking_opinion } = req.body;
        const newSmoking = await pool.query(
            'INSERT INTO Smoking (smoking_opinion) VALUES ($1) RETURNING *',
            [smoking_opinion]
        );
        res.json({
            msg: 'Smoking opinion added successfully',
            error: false,
            data: newSmoking.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const updateSmokingopinion = async (req, res) => {
    try {
        const { id } = req.params; // Get the ID from the URL parameters
        const { smoking_opinion } = req.body;

        const updatedSmoking = await pool.query(
            'UPDATE Smoking SET smoking_opinion = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [smoking_opinion, id]
        );

        if (updatedSmoking.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Smoking opinion not found' });
        }

        res.json({
            msg: 'Smoking opinion updated successfully',
            error: false,
            data: updatedSmoking.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const deleteSmokingopinion = async (req, res) => {
    try {
        const { id } = req.params; // Get the ID from the URL parameters

        const deletedSmoking = await pool.query(
            'DELETE FROM Smoking WHERE id = $1 RETURNING *',
            [id]
        );

        if (deletedSmoking.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Smoking opinion not found' });
        }

        res.json({
            msg: 'Smoking opinion deleted successfully',
            error: false,
            data: deletedSmoking.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const getAllSmokingopinions = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    // Calculate the OFFSET based on the page and limit
    const offset = (page - 1) * limit;

    try {
        let query = `
        SELECT *
        FROM Smoking
      `;

        // Check if pagination parameters are provided
        if (page && limit) {
            query += `
          OFFSET ${offset}
          LIMIT ${limit}
        `;
        }

        const result = await pool.query(query);

        const Smokings = result.rows;
        return res.status(200).json({
            msg: 'All Smoking opinions fetched successfully',
            error: false,
            count: Smokings.length,
            data: Smokings,
        });
    } catch (error) {
        console.error('Error fetching Smokings:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
};

const getSmokingopinionByID = async (req, res) => {
    const SmokingID = req.params.id; // Assuming the ID is passed in the request parameters

    try {
        const query = `
            SELECT *
            FROM Smoking
            WHERE id = $1
        `;

        const result = await pool.query(query, [SmokingID]);

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Smoking opinion not found', error: true });
        }

        const smoking_opinion = result.rows[0];
        return res.status(200).json({
            msg: 'Smoking opinion fetched successfully',
            error: false,
            data: smoking_opinion,
        });
    } catch (error) {
        console.error('Error fetching Smoking opinion:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
};

const getusersofsmokingopinion = async (req, res) => {
    const { smoking_id } = req.body;

    if (!smoking_id) {
        return res.status(400).json({ error: true, msg: 'Smoking ID is missing in the request body' });
    }

    try {
        // Check if the ID exists in the Users table
        const userExistQuery = 'SELECT * FROM Users WHERE id = $1';
        const userExistResult = await pool.query(userExistQuery, [smoking_id]);

        if (userExistResult.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'ID does not exist' });
        }

        // Fetch users associated with the smoking_id
        const usersQuery = 'SELECT * FROM Users WHERE smoking_opinion = $1';
        const usersResult = await pool.query(usersQuery, [smoking_id]);

        // Fetch smoking opinion details for the provided smoking_id
        const smokingQuery = 'SELECT * FROM Smoking WHERE id = $1';
        const smokingResult = await pool.query(smokingQuery, [smoking_id]);

        const usersData = usersResult.rows;
        const smokingData = smokingResult.rows;

        const response = {
            error: false,
            users: usersData,
            smoking_opinion_details: smokingData,
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

module.exports = { addsmokingopinion, updateSmokingopinion, deleteSmokingopinion, getAllSmokingopinions, getSmokingopinionByID, getusersofsmokingopinion };