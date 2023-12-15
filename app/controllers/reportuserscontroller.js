const pool = require("../config/dbconfig")

const reportuser = async (req, res) => {
  const { user_id } = req.params; // Extract user_id from the request parameters
  const { reporter_id, reason, description } = req.body; // Extract reporter_id, reason, and description from the request body

  try {
    // Check if the user exists and fetch user details
    const userExistsQuery = 'SELECT * FROM Users WHERE id = $1';
    const userExistsResult = await pool.query(userExistsQuery, [user_id]);

    if (userExistsResult.rows.length === 0) {
      return res.status(404).json({ error: true, msg: 'User not found' });
    }

    // Check if the reporter exists
    const reporterExistsQuery = 'SELECT * FROM Users WHERE id = $1';
    const reporterExistsResult = await pool.query(reporterExistsQuery, [reporter_id]);

    if (reporterExistsResult.rows.length === 0) {
      return res.status(404).json({ error: true, msg: 'Reporter not found' });
    }

    // Insert report into ReportUsers table
    const reportUserQuery = 'INSERT INTO ReportUsers (user_id, reason, description, reporter_id) VALUES ($1, $2, $3, $4) RETURNING *';
    const reportUserResult = await pool.query(reportUserQuery, [user_id, reason, description, reporter_id]);

    // Update report_status to true for the reported user
    const updateReportStatusQuery = 'UPDATE Users SET report_status = true WHERE id = $1';
    await pool.query(updateReportStatusQuery, [reporter_id]);

    // Get details of the reported user
    const reportedUserQuery = 'SELECT * FROM Users WHERE id = $1';
    const reportedUserResult = await pool.query(reportedUserQuery, [user_id]);
    const reportedUserDetails = reportedUserResult.rows[0];

    // Get details of the reporting user
    const reportingUserQuery = 'SELECT * FROM Users WHERE id = $1';
    const reportingUserResult = await pool.query(reportingUserQuery, [reporter_id]);
    const reportingUserDetails = reportingUserResult.rows[0];

    return res.status(200).json({
      message: 'User reported successfully',
      error: false,
      data: {
        user: reportedUserDetails,
        reporter: reportingUserDetails,
        report_details: reportUserResult.rows[0],
      },
    });
  } catch (error) {
    console.error('Error reporting user:', error);
    return res.status(500).json({ error: true, msg: 'Internal server error' });
  }
};

const getReportedUsers = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = `
          SELECT u.id, u.name, u.email, u.password, u.token, u.signup_type, u.images, u.device_id,
              u.deleted_status, u.block_status, u.height, u.location, u.gender, u.dob, u.verified_status, u.report_status,
              u.created_at, u.updated_at, u.last_active,
              g.gender AS gender_data,
              r.relation_type AS relation_type_data,
              c.cooking_skill AS cooking_skill_data,
              h.habit AS habit_data,
              e.exercise AS exercise_data,
              hb.hobby AS hobby_data,
              s.smoking_opinion AS smoking_opinion_data,
              k.kids_opinion AS kids_opinion_data,
              n.night_life AS night_life_data
          FROM Users u
          LEFT JOIN Gender g ON u.gender::varchar = g.id::varchar
          LEFT JOIN Relationship r ON u.relation_type::varchar = r.id::varchar
          LEFT JOIN Cookingskill c ON u.cooking_skill::varchar = c.id::varchar
          LEFT JOIN Habits h ON u.habit::varchar = h.id::varchar
          LEFT JOIN Exercise e ON u.exercise::varchar = e.id::varchar
          LEFT JOIN Hobbies hb ON u.hobby::varchar = hb.id::varchar
          LEFT JOIN Smoking s ON u.smoking_opinion::varchar = s.id::varchar
          LEFT JOIN Kids k ON u.kids_opinion::varchar = k.id::varchar
          LEFT JOIN Nightlife n ON u.night_life::varchar = n.id::varchar
          WHERE u.report_status = true
      `;

    if (page && limit) {
      query += `
              OFFSET ${offset}
              LIMIT ${limit}
          `;
    }

    const result = await pool.query(query);

    const users = result.rows;
    return res.status(200).json({
      msg: 'Reported users fetched successfully',
      error: false,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching reported users:', error);
    return res.status(500).json({ msg: 'Internal server error', error: true });
  }
};

module.exports = { reportuser, getReportedUsers };