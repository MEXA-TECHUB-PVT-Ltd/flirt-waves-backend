const pool = require("../config/dbconfig")

const reportuser = async (req, res) => {
    const { user_id } = req.params;
    const { reason, description } = req.body;

    try {
        // Check if the user exists
        const userExistsQuery = 'SELECT * FROM Users WHERE id = $1';
        const userExistsResult = await pool.query(userExistsQuery, [user_id]);

        if (userExistsResult.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'User not found' });
        }

        // Check if the user has already been reported
        const existingReportQuery = 'SELECT * FROM ReportUsers WHERE user_id = $1';
        const existingReportResult = await pool.query(existingReportQuery, [user_id]);

        if (existingReportResult.rows.length > 0) {
            return res.status(400).json({ error: true, msg: 'User already reported' });
        }

        // Insert report into ReportUsers table
        const reportUserQuery = 'INSERT INTO ReportUsers (user_id, reason, description) VALUES ($1, $2, $3) RETURNING *';
        const reportUserResult = await pool.query(reportUserQuery, [user_id, reason, description]);

        // Update report_status to true in Users table
        const updateReportStatusQuery = 'UPDATE Users SET report_status = true WHERE id = $1';
        await pool.query(updateReportStatusQuery, [user_id]);

        // Get all details of the reported user
        const reportedUserQuery = 'SELECT * FROM Users WHERE id = $1';
        const reportedUserResult = await pool.query(reportedUserQuery, [user_id]);

        const UserDetails = reportedUserResult.rows[0];

        return res.status(200).json({
            message: 'User reported successfully',
            error: false,
            data: reportUserResult.rows[0],
            UserDetails,
        });
    } catch (error) {
        console.error('Error reporting user:', error);
        return res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

module.exports = { reportuser };