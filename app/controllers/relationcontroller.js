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

const addpreferncerToUser = async (req, res) => {
    try {
        const { user_id, gender_id, relationship_id } = req.body;
    
        // Check if the user exists
        const userExists = await pool.query('SELECT * FROM Users WHERE id = $1', [user_id]);
    
        if (userExists.rows.length === 0) {
          return res.status(404).json({ error: true, msg: 'User not found' });
        }
    
        if (!gender_id && !relationship_id) {
          return res.status(400).json({ error: true, msg: 'Please provide gender_id or relationship_id' });
        }
    
        // Check if the gender exists
        if (gender_id) {
          const genderExists = await pool.query('SELECT * FROM Gender WHERE id = $1', [gender_id]);
    
          if (genderExists.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Gender not found' });
          }
        }
    
        // Check if the relationship exists
        if (relationship_id) {
          const relationshipExists = await pool.query('SELECT * FROM Relationship WHERE id = $1', [relationship_id]);
    
          if (relationshipExists.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Relationship not found' });
          }
        }
    
        // Update association: set both gender_id and relationship_id to null if not provided
        const newAssociation = await pool.query(
          'UPDATE UserRelationships SET gender_id = $2, relationship_id = $3 WHERE user_id = $1 RETURNING *',
          [user_id, gender_id || null, relationship_id || null]
        );
    
        res.json({
          msg: 'Preferences updated successfully',
          error: false,
          data: newAssociation.rows[0],
        });
      } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
      }
};

module.exports = { createRelationship, updateRelationship, deleteRelationship, getAllRelationships, addpreferncerToUser };