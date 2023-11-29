const pool = require("../config/dbconfig")

const addnightlife = async (req, res) => {
    try {
        const { night_life } = req.body;
        const newNightlife = await pool.query(
            'INSERT INTO Nightlife (night_life) VALUES ($1) RETURNING *',
            [night_life]
        );
        res.json({
            msg: 'Night life added successfully',
            error: false,
            data: newNightlife.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const updatenightlife = async (req, res) => {
    try {
        const { id } = req.params; // Get the ID from the URL parameters
        const { night_life } = req.body;

        const updatedNightlife = await pool.query(
            'UPDATE Nightlife SET night_life = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [night_life, id]
        );

        if (updatedNightlife.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Night life not found' });
        }

        res.json({
            msg: 'Night life updated successfully',
            error: false,
            data: updatedNightlife.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const deletenightlife = async (req, res) => {
    try {
        const { id } = req.params; // Get the ID from the URL parameters

        const deletedNightlife = await pool.query(
            'DELETE FROM Nightlife WHERE id = $1 RETURNING *',
            [id]
        );

        if (deletedNightlife.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Night life not found' });
        }

        res.json({
            msg: 'Night life deleted successfully',
            error: false,
            data: deletedNightlife.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const getAllNightlifes = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    // Calculate the OFFSET based on the page and limit
    const offset = (page - 1) * limit;

    try {
        let query = `
        SELECT *
        FROM Nightlife
      `;

        // Check if pagination parameters are provided
        if (page && limit) {
            query += `
          OFFSET ${offset}
          LIMIT ${limit}
        `;
        }

        const result = await pool.query(query);

        const Nightlifes = result.rows;
        return res.status(200).json({
            msg: 'All nightlifes fetched successfully',
            error: false,
            count: Nightlifes.length,
            data: Nightlifes,
        });
    } catch (error) {
        console.error('Error fetching Nightlifes:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
};

const getNightlifeByID = async (req, res) => {
    const nightlifeID = req.params.id; // Assuming the ID is passed in the request parameters

    try {
        const query = `
            SELECT *
            FROM Nightlife
            WHERE id = $1
        `;

        const result = await pool.query(query, [nightlifeID]);

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Night life not found', error: true });
        }

        const night_life = result.rows[0];
        return res.status(200).json({
            msg: 'Night life fetched successfully',
            error: false,
            data: night_life,
        });
    } catch (error) {
        console.error('Error fetching night life:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
};

const getusersofnightlifeopinion = async (req, res) => {
    const { nightlife_id } = req.body;

    if (!nightlife_id) {
        return res.status(400).json({ error: true, msg: 'Nightlife ID is missing in the request body' });
    }

    try {
        // Check if the ID exists in the Users table
        const userExistQuery = 'SELECT * FROM Users WHERE id = $1';
        const userExistResult = await pool.query(userExistQuery, [nightlife_id]);

        if (userExistResult.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'ID does not exist' });
        }

        // Fetch users associated with the nightlife_id
        const usersQuery = 'SELECT * FROM Users WHERE night_life = $1';
        const usersResult = await pool.query(usersQuery, [nightlife_id]);

        // Fetch nightlife opinion details for the provided nightlife_id
        const nightlifeQuery = 'SELECT * FROM Nightlife WHERE id = $1';
        const nightlifeResult = await pool.query(nightlifeQuery, [nightlife_id]);

        const usersData = usersResult.rows;
        const nightlifeData = nightlifeResult.rows;

        const response = {
            error: false,
            users: usersData,
            nightlife_opinion_details: nightlifeData,
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

module.exports = { addnightlife, updatenightlife, deletenightlife, getAllNightlifes, getNightlifeByID, getusersofnightlifeopinion };