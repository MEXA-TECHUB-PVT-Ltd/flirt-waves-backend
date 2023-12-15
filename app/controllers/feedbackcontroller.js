const pool = require("../config/dbconfig")

const addFeedback = async (req, res) => {
    const userId = req.params.userId; // Assuming the user ID is passed in the request parameters
    const { feedback_description } = req.body;

    try {
        // Check if the user exists
        const userQuery = 'SELECT * FROM Users WHERE id = $1';
        const userResult = await pool.query(userQuery, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found', error: true });
        }

        // Add feedback for the user
        const addFeedbackQuery = `
            INSERT INTO Feedback (user_id, feedback_description, created_at, updated_at)
            VALUES ($1, $2, NOW(), NOW())
            RETURNING *
        `;
        const newFeedback = await pool.query(addFeedbackQuery, [userId, feedback_description]);

        const userDetailsQuery = `
        SELECT u.id, u.name, u.email, u.password, u.token, u.signup_type, u.images, u.device_id,
        u.deleted_status, u.block_status, u.height, u.location, u.gender, u.dob,u.latitude,u.longitude, u.verified_status, u.report_status,
        u.deleted_at, u.created_at, u.updated_at, u.last_active,
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
 WHERE u.id = $1
`;

        const userDetailsResult = await pool.query(userDetailsQuery, [userId]);

        if (userDetailsResult.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found', error: true });
        }

        const userWithDetails = userDetailsResult.rows[0];

        res.status(201).json({
            msg: 'Feedback added successfully',
            error: false,
            data: {
                feedback: newFeedback.rows[0],
                user: userWithDetails // Include user details in the response
            },
        });
    } catch (error) {
        console.error('Error adding feedback:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
};

const updateFeedback = async (req, res) => {
    const userId = req.params.userId; // User ID from parameters
    const { feedbackId, feedback_description } = req.body; // Feedback ID and description from request body

    try {
        // Check if the user exists
        const userQuery = 'SELECT * FROM Users WHERE id = $1';
        const userResult = await pool.query(userQuery, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found', error: true });
        }

        // Update feedback for the user
        const updateFeedbackQuery = `
            UPDATE Feedback 
            SET feedback_description = $1, updated_at = NOW()
            WHERE user_id = $2 AND id = $3
            RETURNING *
        `;
        const updatedFeedback = await pool.query(updateFeedbackQuery, [feedback_description, userId, feedbackId]);

        if (updatedFeedback.rows.length === 0) {
            return res.status(404).json({ msg: 'Feedback not found for this user', error: true });
        }

        // Fetch user details based on the userId if needed
        const userDetailsQuery = `
        SELECT u.id, u.name, u.email, u.password, u.token, u.signup_type, u.images, u.device_id,
        u.deleted_status, u.block_status, u.height, u.location, u.gender, u.dob,u.latitude,u.longitude, u.verified_status, u.report_status,
        u.deleted_at, u.created_at, u.updated_at, u.last_active,
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
 WHERE u.id = $1
        `;

        // Execute the user details query as needed
        const userDetailsResult = await pool.query(userDetailsQuery, [userId]);

        if (userDetailsResult.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found', error: true });
        }

        const userWithDetails = userDetailsResult.rows[0];

        res.status(201).json({
            msg: 'Feedback updated successfully',
            error: false,
            data: {
                feedback: updatedFeedback.rows[0],
                user: userWithDetails // Include user details in the response
            },
        });
    } catch (error) {
        console.error('Error updating feedback:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
};

const removeFeedback = async (req, res) => {
    const userId = req.params.userId; // User ID from parameters
    const feedbackIdToRemove = req.body.feedbackId; // Feedback ID to be removed from request body

    try {
        // Check if the user exists
        const userQuery = 'SELECT * FROM Users WHERE id = $1';
        const userResult = await pool.query(userQuery, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found', error: true });
        }

        // Check if the feedback exists for the user
        const feedbackQuery = 'SELECT * FROM Feedback WHERE id = $1 AND user_id = $2';
        const feedbackResult = await pool.query(feedbackQuery, [feedbackIdToRemove, userId]);

        if (feedbackResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Feedback not found for this user', error: true });
        }

        // Get feedback details before removing it
        const feedbackDetailsQuery = 'SELECT * FROM Feedback WHERE id = $1';
        const feedbackDetailsResult = await pool.query(feedbackDetailsQuery, [feedbackIdToRemove]);
        const removedFeedbackDetails = feedbackDetailsResult.rows[0];

        // Remove the feedback
        const deleteQuery = 'DELETE FROM Feedback WHERE id = $1 AND user_id = $2';
        await pool.query(deleteQuery, [feedbackIdToRemove, userId]);

        res.status(200).json({
            msg: 'Feedback removed successfully',
            error: false,
            feedback: removedFeedbackDetails
        });
    } catch (error) {
        console.error('Error removing feedback:', error);
        res.status(500).json({ msg: 'Internal server error', error: true });
    }
};

const getAllFeedbacksByUserId = async (req, res) => {
    const userId = req.params.userId; // User ID from parameters
    const { page = 1, limit = 10 } = req.query; // Pagination parameters

    try {
        // Fetch user details
        const userQuery = `
        SELECT u.id, u.name, u.email, u.password, u.token, u.signup_type, u.images, u.device_id,
        u.deleted_status, u.block_status, u.height, u.location, u.gender, u.dob,u.latitude,u.longitude, u.verified_status, u.report_status,
        u.deleted_at, u.created_at, u.updated_at, u.last_active,
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
 WHERE u.id = $1
        `;

        const userDetailsResult = await pool.query(userQuery, [userId]);
        const userDetails = userDetailsResult.rows[0];

        if (!userDetails) {
            return res.status(404).json({ msg: 'User not found', error: true });
        }

        // Fetch feedbacks for the user with pagination
        const fetchQuery = `
            SELECT id AS feedback_id, feedback_description, created_at AS feedback_created_at
            FROM Feedback
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3;
        `;

        const offset = (page - 1) * limit;
        const fetchResult = await pool.query(fetchQuery, [userId, limit, offset]);
        const feedbacks = fetchResult.rows;

        // Count total feedbacks for the user
        const countQuery = `
            SELECT COUNT(*) AS total_count
            FROM Feedback
            WHERE user_id = $1;
        `;

        const countResult = await pool.query(countQuery, [userId]);
        const totalFeedbacks = parseInt(countResult.rows[0].total_count);

        res.status(200).json({
            msg: 'Feedbacks fetched successfully',
            error: false,
            count: totalFeedbacks,
            user_details: userDetails,
            feedbacks: {
                count: feedbacks.length,
                data: feedbacks
            }
        });
    } catch (error) {
        console.error('Error fetching feedbacks:', error);
        res.status(500).json({ msg: 'Internal server error', error: true });
    }
};

const getAllFeedbacks = async (req, res) => {
    const { page, limit } = req.query;

    try {
        // Get total count of all feedbacks
        const feedbackCountQuery = 'SELECT COUNT(*) FROM Feedback';
        const feedbackCountResult = await pool.query(feedbackCountQuery);
        const totalCount = parseInt(feedbackCountResult.rows[0].count);

        let feedbackData;
        // Fetch all feedbacks with pagination along with user details
        if (page && limit) {
            const offset = (page - 1) * limit;
            const feedbackQuery = `
                SELECT Feedback.*, Users.* FROM Feedback 
                LEFT JOIN Users ON Feedback.user_id = Users.id
                ORDER BY Feedback.created_at DESC 
                LIMIT $1 OFFSET $2
            `;
            const feedbackResult = await pool.query(feedbackQuery, [limit, offset]);
            feedbackData = feedbackResult.rows;
        } else {
            const allFeedbackQuery = `
                SELECT Feedback.*, Users.* FROM Feedback 
                LEFT JOIN Users ON Feedback.user_id = Users.id
                ORDER BY Feedback.created_at DESC
            `;
            const allFeedbackResult = await pool.query(allFeedbackQuery);
            feedbackData = allFeedbackResult.rows;
        }

        // Group feedbacks by user ID
        const userFeedbacks = {};
        feedbackData.forEach((feedback) => {
            const { id, name,email ,images,gender,dob/* other user details */ } = feedback;
            if (!userFeedbacks[id]) {
                userFeedbacks[id] = {
                    userDetails: { id, name ,email,images,gender,dob/* other user details */ },
                    userFeedbacks: [feedback], // Initialize with the first feedback
                };
            } else {
                userFeedbacks[id].userFeedbacks.push(feedback); // Add feedback to existing user
            }
        });

        // Convert object of user feedbacks into an array
        const formattedFeedbacks = Object.values(userFeedbacks)
            .map(({ userDetails, userFeedbacks }) => ({
                ...userDetails,
                userFeedbacks,
            }));

        res.status(200).json({
            error: false,
            count: totalCount,
            feedbacks: formattedFeedbacks,
        });
    } catch (error) {
        console.error('Error fetching feedbacks:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
};

module.exports = { addFeedback, updateFeedback, removeFeedback, getAllFeedbacksByUserId, getAllFeedbacks };