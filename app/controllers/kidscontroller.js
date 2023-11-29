const pool = require("../config/dbconfig")

const addkidsopinion = async (req, res) => {
    try {
        const { kids_opinion } = req.body;
        const newKids = await pool.query(
            'INSERT INTO Kids (kids_opinion) VALUES ($1) RETURNING *',
            [kids_opinion]
        );
        res.json({
            msg: 'Kids opinion added successfully',
            error: false,
            data: newKids.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const updatekidsopinion = async (req, res) => {
    try {
        const { id } = req.params; // Get the ID from the URL parameters
        const { kids_opinion } = req.body;

        const updatedKids = await pool.query(
            'UPDATE Kids SET kids_opinion = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [kids_opinion, id]
        );

        if (updatedKids.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Kid opinion not found' });
        }

        res.json({
            msg: 'Kid opinion updated successfully',
            error: false,
            data: updatedKids.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const deletekidsopinion = async (req, res) => {
    try {
        const { id } = req.params; // Get the ID from the URL parameters

        const deletedKids = await pool.query(
            'DELETE FROM Kids WHERE id = $1 RETURNING *',
            [id]
        );

        if (deletedKids.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Kid opinion not found' });
        }

        res.json({
            msg: 'Kid opinion deleted successfully',
            error: false,
            data: deletedKids.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const getAllkidopinions = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    // Calculate the OFFSET based on the page and limit
    const offset = (page - 1) * limit;

    try {
        let query = `
        SELECT *
        FROM Kids
      `;

        // Check if pagination parameters are provided
        if (page && limit) {
            query += `
          OFFSET ${offset}
          LIMIT ${limit}
        `;
        }

        const result = await pool.query(query);

        const Kidss = result.rows;
        return res.status(200).json({
            msg: 'All Kid opinions fetched successfully',
            error: false,
            count: Kidss.length,
            data: Kidss,
        });
    } catch (error) {
        console.error('Error fetching Kidss:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
};

const getKidopinionByID = async (req, res) => {
    const KidsID = req.params.id; // Assuming the ID is passed in the request parameters

    try {
        const query = `
            SELECT *
            FROM Kids
            WHERE id = $1
        `;

        const result = await pool.query(query, [KidsID]);

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Kid opinion not found', error: true });
        }

        const kids_opinion = result.rows[0];
        return res.status(200).json({
            msg: 'Kid opinion fetched successfully',
            error: false,
            data: kids_opinion,
        });
    } catch (error) {
        console.error('Error fetching Kid opinion:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
};

const getusersofkidopinion = async (req, res) => {
    const { kids_id } = req.body;

    if (!kids_id) {
        return res.status(400).json({ error: true, msg: 'Kids ID is missing in the request body' });
    }

    try {
        // Check if the ID exists in the Users table
        const userExistQuery = 'SELECT * FROM Users WHERE id = $1';
        const userExistResult = await pool.query(userExistQuery, [kids_id]);

        if (userExistResult.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'ID does not exist' });
        }

        // Fetch users associated with the kids_id
        const usersQuery = 'SELECT * FROM Users WHERE kids_opinion = $1';
        const usersResult = await pool.query(usersQuery, [kids_id]);

        // Fetch kids opinion details for the provided kids_id
        const kidsQuery = 'SELECT * FROM Kids WHERE id = $1';
        const kidsResult = await pool.query(kidsQuery, [kids_id]);

        const usersData = usersResult.rows;
        const kidsData = kidsResult.rows;

        const response = {
            error: false,
            users: usersData,
            kids_opinion_details: kidsData,
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

module.exports = { addkidsopinion, updatekidsopinion, deletekidsopinion, getAllkidopinions, getKidopinionByID, getusersofkidopinion };