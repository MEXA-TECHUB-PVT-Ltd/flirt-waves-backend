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

module.exports = { addnightlife, updatenightlife, deletenightlife, getAllNightlifes, getNightlifeByID };