const pool = require("../config/dbconfig")

const creategender = async (req, res) => {
  try {
    const { gender } = req.body;
    const newGender = await pool.query(
      'INSERT INTO gender (gender) VALUES ($1) RETURNING *',
      [gender]
    );
    res.json({ msg: "Gender created succussfully ", error: false, data: newGender.rows[0] });
  } catch (error) {
    res.status(500).json({ error: true, msg: error.message });
  }
};

const updateGender = async (req, res) => {
  try {
    const { id } = req.params; // Get the ID from the URL parameters
    const { gender } = req.body;

    const updatedGender = await pool.query(
      'UPDATE gender SET gender = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [gender, id]
    );

    if (updatedGender.rows.length === 0) {
      return res.status(404).json({ error: true, msg: 'Gender not found' });
    }

    res.json({
      msg: 'Gender updated successfully',
      error: false,
      data: updatedGender.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: true, msg: error.message });
  }
};

const deleteGender = async (req, res) => {
  try {
    const { id } = req.params; // Get the ID from the URL parameters

    const deletedGender = await pool.query(
      'DELETE FROM gender WHERE id = $1 RETURNING *',
      [id]
    );

    if (deletedGender.rows.length === 0) {
      return res.status(404).json({ error: true, msg: 'Gender not found' });
    }

    res.json({
      msg: 'Gender deleted successfully',
      error: false,
      data: deletedGender.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: true, msg: error.message });
  }
};

const getAllGenders = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  // Calculate the OFFSET based on the page and limit
  const offset = (page - 1) * limit;

  try {
    let query = `
        SELECT *
        FROM gender
      `;

    // Check if pagination parameters are provided
    if (page && limit) {
      query += `
          OFFSET ${offset}
          LIMIT ${limit}
        `;
    }

    const result = await pool.query(query);

    const genders = result.rows;
    return res.status(200).json({
      msg: 'Genders fetched successfully',
      error: false,
      count: genders.length,
      data: genders,
    });
  } catch (error) {
    console.error('Error fetching genders:', error);
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

const filterGender = async (req, res) => {
  const { user_id } = req.params;
  const { gender_id } = req.body;

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

    // Check if the gender exists
    const genderQuery = 'SELECT * FROM Gender WHERE id = $1';
    const genderResult = await pool.query(genderQuery, [gender_id]);

    if (genderResult.rows.length === 0) {
      return res.status(404).json({ error: true, msg: 'Gender not found' });
    }

    // Both user and gender exist, return details
    const userData = userResult.rows[0];
    const genderData = genderResult.rows[0];

    res.status(200).json({
      error: false,
      msg: 'User and Gender details fetched successfully',
      user: userData,
      gender: genderData,
    });
  } catch (error) {
    res.status(500).json({ error: true, msg: error.message });
  }
};

module.exports = { filterGender, creategender, updateGender, deleteGender, getAllGenders, addpreferncerToUser };