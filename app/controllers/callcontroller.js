const pool = require("../config/dbconfig")

const createcall = async (req, res) => {

    try {
        const { callerId, receiverId, callStatus, callDuration, callType } = req.body;

        // Check if callStatus and callType are valid
        if (!['INCOMING', 'OUTGOING'].includes(callStatus) || !['AUDIO', 'VIDEO'].includes(callType)) {
            return res.status(400).json({ error: 'Invalid callStatus or callType' });
        }

        // Check if callerId exists in the users table
        const callerExistsQuery = `
          SELECT COUNT(*) FROM users WHERE id = $1;
        `;

        const callerExistsResult = await pool.query(callerExistsQuery, [callerId]);
        const callerExists = callerExistsResult.rows[0].count;

        if (callerExists !== '1') {
            return res.status(400).json({ msg: 'CallerId does not exist', error: true });
        }

        // Check if receiverId exists in the users table
        const receiverExistsQuery = `
          SELECT COUNT(*) FROM users WHERE id = $1;
        `;

        const receiverExistsResult = await pool.query(receiverExistsQuery, [receiverId]);
        const receiverExists = receiverExistsResult.rows[0].count;

        if (receiverExists !== '1') {
            return res.status(400).json({ msg: 'ReceiverId does not exist', error: true });
        }

        // Insert into the calls table
        const insertQuery = `
          INSERT INTO calls (caller_id, receiver_id, call_status, call_duration_minutes, call_type)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *;`;

        const values = [callerId, receiverId, callStatus, callDuration, callType];

        const result = await pool.query(insertQuery, values);

        res.json({ msg: 'Call created successfully', error: false, data: result.rows[0] });
    } catch (error) {
        console.error('Error creating call:', error);
        res.status(500).json({ msg: 'Error creating call', error: true });
    }

}

const getCallsByCallerId = async (req, res) => {
    const { callerId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const callerExistsQuery = `
            SELECT COUNT(*) FROM users WHERE id = $1;
        `;

        const callerExistsResult = await pool.query(callerExistsQuery, [callerId]);
        const callerExists = callerExistsResult.rows[0].count;

        if (callerExists !== '1') {
            return res.status(400).json({ msg: 'CallerId does not exist', error: true });
        }

        const getCallsQuery = `
            SELECT 
                c.*,
                u.id AS user_id
            FROM calls c
            INNER JOIN users u ON c.caller_id = u.id
            WHERE c.caller_id = $1
            OFFSET $2
            LIMIT $3;
        `;

        const callsResult = await pool.query(getCallsQuery, [callerId, offset, limit]);
        const calls = callsResult.rows;

        if (calls.length === 0) {
            return res.json({
                msg: 'No calls found for the callerId',
                error: false,
                data: [],
            });
        }

        const userQuery = `
        SELECT 
            u.id, 
            u.name, 
            u.email, 
            u.password, 
            u.token, 
            u.signup_type, 
            u.images, 
            u.device_id,
            u.deleted_status,
            u.block_status,
            u.height,
            u.location,
            u.latitude,
            u.longitude,
            u.gender,
            u.verified_status,
            u.report_status,
            u.online_status,
            u.subscription_status,
            u.created_at,
            u.updated_at,
            u.deleted_at,
            g.gender AS interested_in_data,
            r.relation_type AS relation_type_data,
            c.cooking_skill AS cooking_skill_data,
            h.habit AS habit_data,
            e.exercise AS exercise_data,
            hb.hobby AS hobby_data,
            s.smoking_opinion AS smoking_opinion_data,
            k.kids_opinion AS kids_opinion_data,
            n.night_life AS night_life_data
        FROM users u
        LEFT JOIN Gender g ON u.interested_in::varchar = g.id::varchar
        LEFT JOIN Relationship r ON u.relation_type::varchar = r.id::varchar
        LEFT JOIN Cookingskill c ON u.cooking_skill::varchar = c.id::varchar
        LEFT JOIN Habits h ON u.habit::varchar = h.id::varchar
        LEFT JOIN Exercise e ON u.exercise::varchar = e.id::varchar
        LEFT JOIN Hobbies hb ON u.hobby::varchar = hb.id::varchar
        LEFT JOIN Smoking s ON u.smoking_opinion::varchar = s.id::varchar
        LEFT JOIN Kids k ON u.kids_opinion::varchar = k.id::varchar
        LEFT JOIN Nightlife n ON u.night_life::varchar = n.id::varchar
        WHERE u.id = $1
        AND u.deleted_status = false;
    `;

        const userResult = await pool.query(userQuery, [callerId]);
        const user = userResult.rows[0];

        res.json({
            msg: 'Data fetched successfully',
            error: false,
            count: calls.length,
            data: {
                user: user ? user : null,
                calls: calls,
            },
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ msg: 'Error fetching data', error: true });
    }
}

const getCallByCallId = async (req, res) => {
    const { callerId, callId } = req.params;

    try {
        const callerExistsQuery = `
            SELECT COUNT(*) FROM users WHERE id = $1;
        `;

        const callerExistsResult = await pool.query(callerExistsQuery, [callerId]);
        const callerExists = callerExistsResult.rows[0].count;

        if (callerExists !== '1') {
            return res.status(400).json({ msg: 'CallerId does not exist', error: true });
        }

        const getCallQuery = `
            SELECT 
                c.*,
                u.id AS user_id
            FROM calls c
            INNER JOIN users u ON c.caller_id = u.id
            WHERE c.caller_id = $1 AND c.call_id = $2;
        `;

        const callResult = await pool.query(getCallQuery, [callerId, callId]);
        const call = callResult.rows[0];

        if (!call) {
            return res.json({
                msg: 'No call found for the provided CallerId and CallId',
                error: false,
                data: null,
            });
        }

        // Fetch user details associated with the callerId
        const userQuery = `
        SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.password, 
        u.token, 
        u.signup_type, 
        u.images, 
        u.device_id,
        u.deleted_status,
        u.block_status,
        u.height,
        u.location,
        u.latitude,
        u.longitude,
        u.gender,
        u.verified_status,
        u.report_status,
        u.online_status,
        u.subscription_status,
        u.created_at,
        u.updated_at,
        u.deleted_at,
        g.gender AS interested_in_data,
        r.relation_type AS relation_type_data,
        c.cooking_skill AS cooking_skill_data,
        h.habit AS habit_data,
        e.exercise AS exercise_data,
        hb.hobby AS hobby_data,
        s.smoking_opinion AS smoking_opinion_data,
        k.kids_opinion AS kids_opinion_data,
        n.night_life AS night_life_data
    FROM users u
    LEFT JOIN Gender g ON u.interested_in::varchar = g.id::varchar
    LEFT JOIN Relationship r ON u.relation_type::varchar = r.id::varchar
    LEFT JOIN Cookingskill c ON u.cooking_skill::varchar = c.id::varchar
    LEFT JOIN Habits h ON u.habit::varchar = h.id::varchar
    LEFT JOIN Exercise e ON u.exercise::varchar = e.id::varchar
    LEFT JOIN Hobbies hb ON u.hobby::varchar = hb.id::varchar
    LEFT JOIN Smoking s ON u.smoking_opinion::varchar = s.id::varchar
    LEFT JOIN Kids k ON u.kids_opinion::varchar = k.id::varchar
    LEFT JOIN Nightlife n ON u.night_life::varchar = n.id::varchar
    WHERE u.id = $1
    AND u.deleted_status = false;
        `;

        const userResult = await pool.query(userQuery, [callerId]);
        const user = userResult.rows[0];

        res.json({
            msg: 'Call data fetched successfully',
            error: false,
            data: {
                user: user ? user : null,
                call: call,
            },
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ msg: 'Error fetching data', error: true });
    }
};

const removeCallByCallId = async (req, res) => {
    const { callerId, callId } = req.params;

    try {
        const getCallQuery = `
            DELETE FROM calls
            WHERE caller_id = $1 AND call_id = $2
            RETURNING *;
        `;

        const callRemovalResult = await pool.query(getCallQuery, [callerId, callId]);
        const removedCall = callRemovalResult.rows[0];

        if (!removedCall) {
            return res.json({
                msg: 'No call found for the provided CallerId and CallId',
                error: false,
                data: null,
            });
        }

        res.json({
            msg: 'Call removed successfully',
            error: false,
            data: {
                removedCall,
            },
        });
    } catch (error) {
        console.error('Error removing call:', error);
        res.status(500).json({ msg: 'Error removing call', error: true });
    }
};

module.exports = { createcall, getCallsByCallerId, getCallByCallId, removeCallByCallId };