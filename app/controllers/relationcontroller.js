const pool = require("../config/dbconfig")

const createRelationship = async (req, res) => {
  try {
    const { relation_type, image } = req.body; // Extract 'relation_type' and 'image' from request body

    const newRelationship = await pool.query(
      'INSERT INTO relationship (relation_type, image) VALUES ($1, $2) RETURNING *',
      [relation_type, image] // Include both 'relation_type' and 'image' in the query parameters
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
    const { relation_type, image } = req.body; // Extract 'gender' and 'image' from request body

    const updatedrelation = await pool.query(
      'UPDATE Relationship SET relation_type = $1, image = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [relation_type, image, id] // Include 'gender', 'image', and 'id' in the query parameters
    );

    if (updatedrelation.rows.length === 0) {
      return res.status(404).json({ error: true, msg: 'Relation not found' });
    }

    res.json({
      msg: 'Relation updated successfully',
      error: false,
      data: updatedrelation.rows[0],
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

  const { relation_type_id, user_id } = req.body;
  const { page, limit } = req.query;

  if (!relation_type_id || !user_id) {
    return res.status(400).json({ error: true, msg: 'Relation type ID or User ID is missing in the request body' });
  }

  // Check if the provided user ID exists in the Users table
  const userCheckQuery = 'SELECT * FROM Users WHERE id = $1 LIMIT 1';
  const userCheckResult = await pool.query(userCheckQuery, [user_id]);

  if (userCheckResult.rows.length === 0) {
    return res.status(404).json({ error: true, msg: 'User ID does not exist in the database' });
  }

  let query = `
    SELECT *,
    ( 6371 * acos( cos( radians($1) ) * cos( radians( latitude ) )
    * cos( radians( longitude ) - radians($2) ) + sin( radians($3) )
    * sin( radians( latitude ) ) ) ) AS distance,
    EXTRACT(YEAR FROM AGE(TO_DATE(dob, 'YYYY-MM-DD'))) AS age
    FROM Users
    WHERE relation_type = $4
    AND id != $5 -- Exclude the provided user ID
    AND report_status = false
    AND deleted_status = false
    AND block_status = false
  `;

  const params = [user_id, user_id, user_id, relation_type_id, user_id];

  if (page && limit) {
    const offset = (page - 1) * limit;
    query += ` OFFSET $6 LIMIT $7`;
    params.push(offset, limit);
  }

  try {
    const usersResult = await pool.query(query, params);

    if (usersResult.rows.length === 0) {
      return res.status(404).json({ error: true, msg: 'No users found for the provided relation type ID' });
    }

    const usersData = usersResult.rows;

    // To get the count of users
    const countQuery = 'SELECT COUNT(*) FROM Users WHERE relation_type = $1';
    const countResult = await pool.query(countQuery, [relation_type_id]);
    const totalCount = countResult.rows[0].length;

    const response = {
      error: false,
      count: usersData.length,
      users: usersData,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: true, msg: 'Internal server error' });
  }

}

const filterRelationship = async (req, res) => {
  const { user_id } = req.params;
  const { relation_id } = req.body;

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

    // Check if the relationship exists
    const relationshipQuery = 'SELECT * FROM Relationship WHERE id = $1';
    const relationshipResult = await pool.query(relationshipQuery, [relation_id]);

    if (relationshipResult.rows.length === 0) {
      return res.status(404).json({ error: true, msg: 'Relationship not found' });
    }

    // Both user and relationship exist, return details
    const userData = userResult.rows[0];
    const relationshipData = relationshipResult.rows[0];

    res.status(200).json({
      error: false,
      msg: 'User and Relationship details fetched successfully',
      user: userData,
      relationship: relationshipData,
    });
  } catch (error) {
    res.status(500).json({ error: true, msg: error.message });
  }
};

module.exports = { filterRelationship, createRelationship, updateRelationship, deleteRelationship, getAllRelationships, addpreferncerToUser, getusersofrelationtype };