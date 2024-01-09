const pool = require("../config/dbconfig")

const getUserDetailsById = async (userId) => {
  try {
    const userQuery = `
        SELECT u.id, u.name, u.email, u.password, u.token, u.signup_type, u.images, u.device_id,
        u.deleted_status, u.block_status, u.height, u.location, u.gender, u.dob,u.latitude,u.longitude, u.verified_status, u.report_status,
        u.created_at, u.updated_at, u.last_active,
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
        LEFT JOIN Gender g ON CAST(u.interested_in AS INTEGER) = g.id
        LEFT JOIN Relationship r ON CAST(u.relation_type AS INTEGER) = r.id
        LEFT JOIN Cookingskill c ON CAST(u.cooking_skill AS INTEGER) = c.id
        LEFT JOIN Habits h ON CAST(u.habit AS INTEGER) = h.id
        LEFT JOIN Exercise e ON CAST(u.exercise AS INTEGER) = e.id
        LEFT JOIN Hobbies hb ON CAST(u.hobby AS INTEGER) = hb.id
        LEFT JOIN Smoking s ON CAST(u.smoking_opinion AS INTEGER) = s.id
        LEFT JOIN Kids k ON CAST(u.kids_opinion AS INTEGER) = k.id
        LEFT JOIN Nightlife n ON CAST(u.night_life AS INTEGER) = n.id
        WHERE u.id = $1;
      `;

    const userResult = await pool.query(userQuery, [userId]);
    return userResult.rows[0]; // Return user details
  } catch (error) {
    throw new Error(`Error fetching user details: ${error.message}`);
  }
};

const createcall = async (req, res) => {
  try {
    const { caller_id, receiver_id, channel_name, call_type, call_status } = req.body;

    // Check if caller_id exists in the users table
    const callerCheckQuery = `
          SELECT id FROM users WHERE id = $1;
      `;

    const callerCheckResult = await pool.query(callerCheckQuery, [caller_id]);

    if (callerCheckResult.rows.length !== 1) {
      return res.status(400).json({ msg: 'Caller does not exist', error: true });
    }

    // Check if receiver_id exists in the users table
    const receiverCheckQuery = `
          SELECT id FROM users WHERE id = $1;
      `;

    const receiverCheckResult = await pool.query(receiverCheckQuery, [receiver_id]);

    if (receiverCheckResult.rows.length !== 1) {
      return res.status(400).json({ msg: 'Receiver does not exist', error: true });
    }

    // Check if the call_type is AUDIO or VIDEO
    const validCallTypes = ['AUDIO', 'VIDEO'];
    if (!validCallTypes.includes(call_type.toUpperCase())) {
      return res.status(400).json({ msg: 'Invalid call type. It must be AUDIO or VIDEO', error: true });
    }

    // Check if the call_status is ACCEPT, DECLINED, or NOTANSWERED
    const validCallStatus = ['ACCEPT', 'DECLINED', 'NOTANSWERED'];
    if (!validCallStatus.includes(call_status.toUpperCase())) {
      return res.status(400).json({ msg: 'Invalid call status. It must be ACCEPT, DECLINED, or NOTANSWERED', error: true });
    }

    // Check if the channel_name is unique
    const channelNameCheckQuery = `
          SELECT channel_name FROM calls WHERE channel_name = $1;
      `;

    const channelNameCheckResult = await pool.query(channelNameCheckQuery, [channel_name]);

    if (channelNameCheckResult.rows.length !== 0) {
      return res.status(400).json({ msg: 'Channel name must be unique', error: true });
    }

    const query = `
          INSERT INTO calls (caller_id, receiver_id, channel_name, call_type, call_status)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *;
      `;

    const values = [caller_id, receiver_id, channel_name, call_type.toUpperCase(), call_status.toUpperCase()]; // Ensure call_type and call_status are uppercase

    const result = await pool.query(query, values);

    // Fetch details of the caller using the provided query
    const userDetails = await getUserDetailsById(caller_id); // Assuming this function fetches user details

    res.json({
      msg: 'Call created successfully',
      error: false,
      call: result.rows[0],
      caller_details: userDetails, // Include caller details in the response
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

}

const updateCallDuration = async (req, res) => {
  try {
    const { caller_id, call_id, call_duration } = req.body;

    // Check if caller_id exists in the users table
    const callerCheckQuery = `
        SELECT id FROM users WHERE id = $1;
      `;

    const callerCheckResult = await pool.query(callerCheckQuery, [caller_id]);

    if (callerCheckResult.rows.length !== 1) {
      return res.status(400).json({ msg: 'Caller does not exist', error: true });
    }

    // Check if call_id exists in the calls table
    const callCheckQuery = `
        SELECT * FROM calls WHERE call_id = $1;
      `;

    const callCheckResult = await pool.query(callCheckQuery, [call_id]);

    if (callCheckResult.rows.length !== 1) {
      return res.status(400).json({ msg: 'Call does not exist', error: true });
    }

    // Update the call duration
    const updateCallQuery = `
        UPDATE calls SET call_duration = $1 WHERE call_id = $2 RETURNING *;
      `;

    const updateResult = await pool.query(updateCallQuery, [call_duration, call_id]);

    // Fetch details of the caller using the provided query
    const userDetails = await getUserDetailsById(caller_id); // Assuming this function fetches user details

    res.json({
      msg: 'Call duration updated successfully',
      error: false,
      call: updateResult.rows[0],
      caller_details: userDetails, // Include caller details in the response
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateCallStatus = async (req, res) => {
  try {
    const { caller_id, call_id, call_status } = req.body;

    // Check if caller_id exists in the users table
    const callerCheckQuery = `
        SELECT id FROM users WHERE id = $1;
      `;

    const callerCheckResult = await pool.query(callerCheckQuery, [caller_id]);

    if (callerCheckResult.rows.length !== 1) {
      return res.status(400).json({ msg: 'Caller does not exist', error: true });
    }

    // Check if call_id exists in the calls table
    const callCheckQuery = `
        SELECT * FROM calls WHERE call_id = $1;
      `;

    const callCheckResult = await pool.query(callCheckQuery, [call_id]);

    if (callCheckResult.rows.length !== 1) {
      return res.status(400).json({ msg: 'Call does not exist', error: true });
    }

    // Check if the call_status is ACCEPT, DECLINED, or NOTANSWERED
    const validCallStatus = ['ACCEPT', 'DECLINED', 'NOTANSWERED'];
    if (!validCallStatus.includes(call_status.toUpperCase())) {
      return res.status(400).json({ msg: 'Invalid call status. It must be ACCEPT, DECLINED, or NOTANSWERED', error: true });
    }

    // Update the call status
    const updateCallStatusQuery = `
        UPDATE calls SET call_status = $1 WHERE call_id = $2 RETURNING *;
      `;

    const updateResult = await pool.query(updateCallStatusQuery, [call_status.toUpperCase(), call_id]);

    // Fetch details of the caller using the provided query
    const userDetails = await getUserDetailsById(caller_id); // Assuming this function fetches user details

    res.json({
      msg: 'Call status updated successfully',
      error: false,
      call: updateResult.rows[0],
      caller_details: userDetails, // Include caller details in the response
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCallsByCallerId = async (req, res) => {
  const callerId = req.params.caller_id; // Caller ID from parameters
  const { page = 1, limit = 10 } = req.query; // Pagination parameters

  try {
    // Fetch total count of calls made by the specified caller_id
    const countQuery = `
        SELECT COUNT(*) AS total_count FROM calls WHERE caller_id = $1;
      `;

    const countResult = await pool.query(countQuery, [callerId]);
    const totalCalls = parseInt(countResult.rows[0].total_count);

    // If there are no calls for the caller, return an empty response
    if (totalCalls === 0) {
      return res.status(200).json({
        msg: 'No calls found for the caller',
        error: false,
        count: 0,
        calls: {
          data: [],
        },
      });
    }

    // Fetch caller details only when there are calls
    const userDetails = await getUserDetailsById(callerId); // Fetch caller details using the provided function

    // Fetch all calls made by the specified caller_id with pagination and caller/receiver details
    const offset = (page - 1) * limit;
    const getCallsQuery = `
        SELECT calls.*, 
               caller_details.*, 
               receiver_details.*
        FROM calls
        JOIN users AS caller_details ON calls.caller_id = caller_details.id
        JOIN users AS receiver_details ON calls.receiver_id = receiver_details.id
        WHERE calls.caller_id = $1 
        ORDER BY calls.created_at DESC 
        OFFSET $2
        LIMIT $3;
      `;

    const callsResult = await pool.query(getCallsQuery, [callerId, offset, limit]);
    const calls = callsResult.rows;

    res.status(200).json({
      msg: 'Calls retrieved successfully',
      error: false,
      count: totalCalls,
      caller_details: userDetails,
      calls: {
        count: calls.length,
        data: calls,
      },
    });
  } catch (error) {
    res.status(500).json({ msg: 'Internal server error', error: true });
  }
}

const getCallByCallId = async (req, res) => {
  const { caller_id, call_id } = req.body; // Caller ID and Call ID from request body

  try {
    // Check if caller_id exists in the users table
    const callerCheckQuery = `
        SELECT id FROM users WHERE id = $1;
      `;

    const callerCheckResult = await pool.query(callerCheckQuery, [caller_id]);

    if (callerCheckResult.rows.length !== 1) {
      return res.status(404).json({ msg: 'Caller not found', error: true });
    }

    // Fetch caller details
    const userDetails = await getUserDetailsById(caller_id); // Fetch caller details using the provided function

    // Fetch details of the specific call made by the specified caller_id
    const getCallQuery = `
        SELECT * FROM calls WHERE caller_id = $1 AND call_id = $2;
      `;

    const callResult = await pool.query(getCallQuery, [caller_id, call_id]);
    const call = callResult.rows[0];

    if (!call) {
      return res.status(404).json({ msg: 'Call not found for the specified caller', error: true });
    }

    res.status(200).json({
      msg: 'Specific call retrieved successfully',
      error: false,
      caller_details: userDetails,
      call: call,
    });
  } catch (error) {
    res.status(500).json({ msg: 'Internal server error', error: true });
  }
};

const removeCallByCallId = async (req, res) => {
  const { caller_id, call_id } = req.body; // Caller ID and Call ID from request body

  try {
    // Check if caller_id exists in the users table
    const callerCheckQuery = `
        SELECT id FROM users WHERE id = $1;
      `;

    const callerCheckResult = await pool.query(callerCheckQuery, [caller_id]);

    if (callerCheckResult.rows.length !== 1) {
      return res.status(404).json({ msg: 'Caller not found', error: true });
    }

    // Delete the specific call made by the specified caller_id
    const deleteCallQuery = `
        DELETE FROM calls WHERE caller_id = $1 AND call_id = $2 RETURNING *;
      `;

    const deletedCallResult = await pool.query(deleteCallQuery, [caller_id, call_id]);
    const deletedCall = deletedCallResult.rows[0];

    if (!deletedCall) {
      return res.status(404).json({ msg: 'Call not found for the specified caller', error: true });
    }

    res.status(200).json({
      msg: 'Call removed successfully',
      error: false,
      deleted_call: deletedCall,
    });
  } catch (error) {
    res.status(500).json({ msg: 'Internal server error', error: true });
  }
};

module.exports = { createcall, updateCallDuration, updateCallStatus, getCallsByCallerId, getCallByCallId, removeCallByCallId };