const pool = require("../config/dbconfig")

const createRelationship = async (req, res) => {
    try {
        const { relation_type } = req.body;
        const newRelationship = await pool.query(
            'INSERT INTO relationship (relation_type) VALUES ($1) RETURNING *',
            [relation_type]
        );
        res.json({
            msg: 'Relationship created successfully',
            error: false,
            data: newRelationship.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const updateRelationship = async (req, res) => {
    try {
        const { id } = req.params; // Get the ID from the URL parameters
        const { relation_type } = req.body;

        const updatedRelationship = await pool.query(
            'UPDATE relationship SET relation_type = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [relation_type, id]
        );

        if (updatedRelationship.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Relationship not found' });
        }

        res.json({
            msg: 'Relationship updated successfully',
            error: false,
            data: updatedRelationship.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const deleteRelationship = async (req, res) => {
    try {
        const { id } = req.params; // Get the ID from the URL parameters

        const deletedRelationship = await pool.query(
            'DELETE FROM relationship WHERE id = $1 RETURNING *',
            [id]
        );

        if (deletedRelationship.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Relationship not found' });
        }

        res.json({
            msg: 'Relationship deleted successfully',
            error: false,
            data: deletedRelationship.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const getAllRelationships = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    // Calculate the OFFSET based on the page and limit
    const offset = (page - 1) * limit;

    try {
        let query = `
        SELECT *
        FROM relationship
      `;

        // Check if pagination parameters are provided
        if (page && limit) {
            query += `
          OFFSET ${offset}
          LIMIT ${limit}
        `;
        }

        const result = await pool.query(query);

        const relationships = result.rows;
        return res.status(200).json({
            msg: 'Relationships fetched successfully',
            error: false,
            count: relationships.length,
            data: relationships,
        });
    } catch (error) {
        console.error('Error fetching relationships:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
};

module.exports = { createRelationship, updateRelationship, deleteRelationship, getAllRelationships };