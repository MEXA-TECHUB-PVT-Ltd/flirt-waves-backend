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
    const { userid } = req.params; // Get the user ID from the URL parameters
    const {
      name, dob, location, height, gender, interested_in, relation_type,
      cooking_skill, habit, hobby, exercise, smoking_opinion, kids_opinion, night_life
    } = req.body;

    const updatedUser = await pool.query(
      `UPDATE Users 
       SET name = $1, dob = $2, location = $3, height = $4, gender = $5,
           interested_in = $6, relation_type = $7, cooking_skill = $8, habit = $9,
           hobby = $10, exercise = $11, smoking_opinion = $12, kids_opinion = $13,
           night_life = $14, updated_at = NOW()
       WHERE id = $15
       RETURNING *`,
      [
        name, dob, location, height, gender, interested_in, relation_type,
        cooking_skill, habit, hobby, exercise, smoking_opinion, kids_opinion, night_life, userid
      ]
    );

    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ error: true, msg: 'User not found or no changes applied' });
    }

    res.json({
      msg: 'User profile updated successfully',
      error: false,
      data: updatedUser.rows[0],
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

const getusersofrelationtype = async (req, res) => {

  const { relation_type_id } = req.body;

  if (!relation_type_id) {
    return res.status(400).json({ error: true, msg: 'Relation type ID is missing in the request body' });
  }

  try {
    // Check if the ID exists in the Users table
    const userExistQuery = 'SELECT * FROM Users WHERE id = $1';
    const userExistResult = await pool.query(userExistQuery, [relation_type_id]);

    if (userExistResult.rows.length === 0) {
      return res.status(404).json({ error: true, msg: 'ID does not exist' });
    }

    // Fetch users associated with the relation_type_id
    const usersQuery = 'SELECT * FROM Users WHERE relation_type = $1';
    const usersResult = await pool.query(usersQuery, [relation_type_id]);

    // Fetch relationship details for the provided relation_type_id
    const relationshipQuery = 'SELECT * FROM Relationship WHERE id = $1';
    const relationshipResult = await pool.query(relationshipQuery, [relation_type_id]);

    const usersData = usersResult.rows;
    const relationshipData = relationshipResult.rows;
    console.log(relationshipData);
    const response = {
      error: false,
      users: usersData,
      relationship_details: relationshipData,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: true, msg: 'Internal server error' });
  }

}

module.exports = { createRelationship, updateRelationship, deleteRelationship, getAllRelationships, addpreferncerToUser, getusersofrelationtype };