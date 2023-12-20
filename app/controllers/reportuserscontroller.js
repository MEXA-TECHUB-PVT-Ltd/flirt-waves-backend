const pool = require("../config/dbconfig")

const reportuser = async (req, res) => {
  const { user_id } = req.params;
  const { reporter_id, reason, description } = req.body;

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

    // Check if the user has already been reported by the same reporter
    const alreadyReportedQuery = 'SELECT * FROM ReportUsers WHERE user_id = $1 AND reporter_id = $2';
    const alreadyReportedResult = await pool.query(alreadyReportedQuery, [user_id, reporter_id]);

    if (alreadyReportedResult.rows.length > 0) {
      return res.status(400).json({ error: true, msg: 'You have already reported this user' });
    }

    // Insert report into ReportUsers table
    const reportUserQuery = 'INSERT INTO ReportUsers (user_id, reason, description, reporter_id) VALUES ($1, $2, $3, $4) RETURNING *';
    const reportUserResult = await pool.query(reportUserQuery, [user_id, reason, description, reporter_id]);

    console.log("req.body.user_id",req.body.user_id,reporter_id)
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
  // const { page = 1, limit = 10 } = req.query;
  // const offset = (page - 1) * limit;

  // try {
  //   let query = `
  //         SELECT u.id, u.name, u.email, u.password, u.token, u.signup_type, u.images, u.device_id,
  //             u.deleted_status, u.block_status, u.height, u.location, u.gender, u.dob, u.verified_status, u.report_status,
  //             u.created_at, u.updated_at, u.last_active,
  //             g.gender AS gender_data,
  //             r.relation_type AS relation_type_data,
  //             c.cooking_skill AS cooking_skill_data,
  //             h.habit AS habit_data,
  //             e.exercise AS exercise_data,
  //             hb.hobby AS hobby_data,
  //             s.smoking_opinion AS smoking_opinion_data,
  //             k.kids_opinion AS kids_opinion_data,
  //             n.night_life AS night_life_data
  //         FROM Users u
  //         LEFT JOIN Gender g ON u.gender::varchar = g.id::varchar
  //         LEFT JOIN Relationship r ON u.relation_type::varchar = r.id::varchar
  //         LEFT JOIN Cookingskill c ON u.cooking_skill::varchar = c.id::varchar
  //         LEFT JOIN Habits h ON u.habit::varchar = h.id::varchar
  //         LEFT JOIN Exercise e ON u.exercise::varchar = e.id::varchar
  //         LEFT JOIN Hobbies hb ON u.hobby::varchar = hb.id::varchar
  //         LEFT JOIN Smoking s ON u.smoking_opinion::varchar = s.id::varchar
  //         LEFT JOIN Kids k ON u.kids_opinion::varchar = k.id::varchar
  //         LEFT JOIN Nightlife n ON u.night_life::varchar = n.id::varchar
  //         WHERE u.report_status = true
  //     `;

  //   if (page && limit) {
  //     query += `
  //             OFFSET ${offset}
  //             LIMIT ${limit}
  //         `;
  //   }

  //   const result = await pool.query(query);

  //   const users = result.rows;
  //   return res.status(200).json({
  //     msg: 'Reported users fetched successfully',
  //     error: false,
  //     count: users.length,
  //     data: users,
  //   });
  // } catch (error) {
  //   console.error('Error fetching reported users:', error);
  //   return res.status(500).json({ msg: 'Internal server error', error: true });
  // }
  try {
    const reportedUsersQuery = `
      SELECT RU.*, U.name AS reported_name, U.email AS reported_email, U.dob AS reported_dob, U.gender AS reported_gender,
      R.name AS reporter_name, R.email AS reporter_email, R.dob AS reporter_dob, R.gender AS reporter_gender
      FROM ReportUsers RU
      INNER JOIN Users U ON RU.user_id = U.id
      INNER JOIN Users R ON RU.reporter_id = R.id
    `;
    const reportedUsersResult = await pool.query(reportedUsersQuery);

    if (reportedUsersResult.rows.length === 0) {
      return res.status(404).json({ error: true, msg: 'No reported users found' });
    }

    const reportedUsers = reportedUsersResult.rows.map((reportedUser) => ({
      user: {
        id: reportedUser.user_id,
        username: reportedUser.reported_name,
        email: reportedUser.reported_email,
        dob: reportedUser.reported_dob,
        gender: reportedUser.reported_gender,
        // Add other user details as needed
      },
      reported_user: {
        id: reportedUser.reporter_id,
        username: reportedUser.reporter_name,
        email: reportedUser.reporter_email,
        dob: reportedUser.reporter_dob,
        gender: reportedUser.reporter_gender,
        // Add other reporter details as needed
      },
      report_details: {
        reason: reportedUser.reason,
        description: reportedUser.description,
        // Add other report details as needed
      },
    }));

    return res.status(200).json({
      message: 'List of reported users retrieved successfully',
      error: false,
      data: reportedUsers,
    });
  } catch (error) {
    console.error('Error retrieving reported users:', error);
    return res.status(500).json({ error: true, msg: 'Internal server error' });
  }
};

module.exports = { reportuser, getReportedUsers };