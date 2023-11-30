const pool = require("../config/dbconfig")

const addcrush = async (req, res) => {
    const userId = req.params.userId;
    const { crushIds } = req.body;

    try {
        // Check if the user ID exists
        const userExistsQuery = 'SELECT COUNT(*) AS count FROM Users WHERE id = $1';
        const userExistsResult = await pool.query(userExistsQuery, [userId]);

        if (parseInt(userExistsResult.rows[0].count) === 0) {
            return res.status(400).json({ error: true, msg: 'User ID does not exist' });
        }

        // Check if all crush IDs exist
        const crushIdsExistsQuery = 'SELECT COUNT(*) AS count FROM Users WHERE id = ANY($1)';
        const crushIdsExistsResult = await pool.query(crushIdsExistsQuery, [crushIds]);

        if (parseInt(crushIdsExistsResult.rows[0].count) !== crushIds.length) {
            return res.status(400).json({ error: true, msg: "Check the crush id's must exist which you're providing" });
        }

        const addCrushesQuery = `
        INSERT INTO userscrushes (user_id, crush_id)
        VALUES ${crushIds
                .map((_, index) => `($1, $${index + 2})`)
                .join(',')}
        ON CONFLICT (user_id, crush_id) DO NOTHING;
    `;

        const queryValues = [userId, ...crushIds];
        await pool.query(addCrushesQuery, queryValues);

        // Fetch user details after adding crushes
        const userQuery = `
      SELECT * FROM Users
      WHERE id = $1;
    `;
        const userResult = await pool.query(userQuery, [userId]);

        // Fetch crushes details after adding crushes
        const crushesQuery = `
      SELECT * FROM Users
      WHERE id = ANY($1);
    `;
        const crushesResult = await pool.query(crushesQuery, [crushIds]);

        const userData = userResult.rows[0];
        const crushesData = crushesResult.rows;

        res.status(200).json({
            msg: 'Crushes added successfully',
            error: false,
            user: userData,
            crushes: crushesData
        });
    } catch (error) {
        console.error('Error adding crushes:', error);
        res.status(500).json({ error: true, msg: 'Unable to add crushes' });
    }
};

const getUserCrushes = async (req, res) => {
    const userId = req.params.userId;
    const { page = 1, limit = 10 } = req.query;

    try {
        // Check if the user ID exists
        const userExistsQuery = 'SELECT COUNT(*) AS count FROM Users WHERE id = $1';
        const userExistsResult = await pool.query(userExistsQuery, [userId]);

        if (parseInt(userExistsResult.rows[0].count) === 0) {
            return res.status(400).json({ error: true, msg: 'User ID does not exist' });
        }

        // Calculate the OFFSET based on the page and limit
        const offset = (page - 1) * limit;

        // Retrieve crushes of the user with pagination
        const userCrushesQuery = `
            SELECT u.* FROM Users u
            JOIN userscrushes uc ON uc.crush_id = u.id
            WHERE uc.user_id = $1
            LIMIT ${limit}
            OFFSET ${offset};
        `;
        const userCrushesResult = await pool.query(userCrushesQuery, [userId]);

        const userCrushesData = userCrushesResult.rows;

        res.status(200).json({
            msg: 'Retrieved user crushes successfully',
            error: false,
            count: userCrushesData.length,
            userCrushes: userCrushesData
        });
    } catch (error) {
        console.error('Error retrieving user crushes:', error);
        res.status(500).json({ error: true, msg: 'Unable to retrieve user crushes' });
    }

};

const deleteuserCrush = async (req, res) => {
    const userId = req.params.userId;
    const { crushId } = req.body;

    try {
        // Check if the user ID exists
        const userExistsQuery = 'SELECT COUNT(*) AS count FROM Users WHERE id = $1';
        const userExistsResult = await pool.query(userExistsQuery, [userId]);

        if (parseInt(userExistsResult.rows[0].count) === 0) {
            return res.status(400).json({ error: true, msg: 'User ID does not exist' });
        }

        // Check if the crush ID exists in user's crushes
        const crushExistsQuery = `
            SELECT COUNT(*) AS count
            FROM userscrushes
            WHERE user_id = $1 AND crush_id = $2;
        `;
        const crushExistsResult = await pool.query(crushExistsQuery, [userId, crushId]);

        if (parseInt(crushExistsResult.rows[0].count) === 0) {
            return res.status(400).json({ error: true, msg: 'Crush ID not found for the user' });
        }

        // Delete the crush from the user's records
        const deleteCrushQuery = `
            DELETE FROM userscrushes
            WHERE user_id = $1 AND crush_id = $2;
        `;
        await pool.query(deleteCrushQuery, [userId, crushId]);

        res.status(200).json({
            msg: 'Crush deleted successfully',
            error: false,
        });
    } catch (error) {
        console.error('Error deleting crush:', error);
        res.status(500).json({ error: true, msg: 'Unable to delete crush' });
    }
};

const deleteAllUserCrushes = async (req, res) => {
    const userId = req.params.userId;

    try {
        // Check if the user ID exists
        const userExistsQuery = 'SELECT COUNT(*) AS count FROM Users WHERE id = $1';
        const userExistsResult = await pool.query(userExistsQuery, [userId]);

        if (parseInt(userExistsResult.rows[0].count) === 0) {
            return res.status(400).json({ error: true, msg: 'User ID does not exist' });
        }

        // Delete all crushes associated with the user
        const deleteCrushesQuery = 'DELETE FROM userscrushes WHERE user_id = $1';
        await pool.query(deleteCrushesQuery, [userId]);

        res.status(200).json({
            msg: 'All crushes deleted successfully',
            error: false,
        });
    } catch (error) {
        console.error('Error deleting all user crushes:', error);
        res.status(500).json({ error: true, msg: 'Unable to delete user crushes' });
    }
};

const getAllCrushesWithUsers = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    try {
        // Calculate the OFFSET based on the page and limit
        const offset = (page - 1) * limit;

        // Retrieve all crushes with their associated users and their details
        const allCrushesQuery = `
            SELECT 
                u.id as user_id, 
                u.name as user_name, 
                u.email as user_email, 
                u.password as user_password, 
                u.token as user_token,
                u.signup_type as user_signup_type, 
                u.image as user_image,
                u.device_id as user_device_id,
                u.deleted_status as user_deleted_status,  
                u.block_status as user_block_status,  
                u.gender as user_gender,
                u.relation_type as user_relation_type,
                u.cooking_skill as user_cooking_skill,
                u.habit as user_habit,
                u.exercise as user_exercise,
                u.hobby as user_hobby, 
                u.smoking_opinion as user_smoking_opinion,
                u.kids_opinion as user_kids_opinion,
                u.night_life as user_night_life,
                u.interested_in as user_interested_in, 
                u.verified_status as user_verified_status,
                u.report_status as user_report_status, 
                c.id as crush_id, 
                c.name as crush_name,
                c.email as crush_email,
                c.password as crush_password, 
                c.token as crush_token,
                c.signup_type as crush_signup_type, 
                c.image as crush_image,
                c.device_id as crush_device_id,
                c.deleted_status as crush_deleted_status,  
                c.block_status as crush_block_status,  
                c.gender as crush_gender,
                c.relation_type as crush_relation_type,
                c.cooking_skill as crush_cooking_skill,
                c.habit as crush_habit,
                c.exercise as crush_exercise,
                c.hobby as crush_hobby, 
                c.smoking_opinion as crush_smoking_opinion,
                c.kids_opinion as crush_kids_opinion,
                c.night_life as crush_night_life,
                c.interested_in as crush_interested_in, 
                c.verified_status as crush_verified_status
            FROM 
                userscrushes uc
            JOIN 
                Users u ON uc.user_id = u.id
            JOIN 
                Users c ON uc.crush_id = c.id;
        `;
        const allCrushesResult = await pool.query(allCrushesQuery);

        const crushesData = allCrushesResult.rows;

        // Fetch total count of crushes
        const totalCountQuery = 'SELECT COUNT(*) AS count FROM userscrushes';
        const totalCountResult = await pool.query(totalCountQuery);
        const totalCount = parseInt(totalCountResult.rows[0].count);

        res.status(200).json({
            msg: 'All crushes with user details retrieved successfully',
            error: false,
            count: crushesData.length,
            totalCount,
            crushes: crushesData
        });
    } catch (error) {
        console.error('Error retrieving all crushes with users:', error);
        res.status(500).json({ error: true, msg: 'Unable to retrieve crushes with users' });
    }
};

const updateCrushes = async (req, res) => {
    const userId = req.params.userId;
    const { crushIds } = req.body;

    console.log(userId, crushIds);

    try {
        // Check if the user ID exists
        const userExistsQuery = 'SELECT COUNT(*) AS count FROM Users WHERE id = $1';
        const userExistsResult = await pool.query(userExistsQuery, [userId]);

        if (parseInt(userExistsResult.rows[0].count) === 0) {
            return res.status(400).json({ error: true, msg: 'User ID does not exist' });
        }

        // Check if all crush IDs exist
        const crushIdsExistsQuery = 'SELECT COUNT(*) AS count FROM Users WHERE id = ANY($1)';
        const crushIdsExistsResult = await pool.query(crushIdsExistsQuery, [crushIds]);

        if (parseInt(crushIdsExistsResult.rows[0].count) !== crushIds.length) {
            return res.status(400).json({ error: true, msg: "Check the crush IDs provided; some may not exist" });
        }

        // Update the user's crushes
        const updateCrushesQuery = `
        DELETE FROM userscrushes
        WHERE user_id = $1;

        INSERT INTO userscrushes (user_id, crush_id)
        VALUES ${crushIds
                .map((_, index) => `($1, $${index + 2})`)
                .join(',')}
        ON CONFLICT (user_id, crush_id) DO NOTHING;
        `;

        const queryValues = [userId, ...crushIds];
        await pool.query(updateCrushesQuery, queryValues);

        // Fetch user details after updating crushes
        const userQuery = `
        SELECT * FROM Users
        WHERE id = $1;
        `;
        const userResult = await pool.query(userQuery, [userId]);

        // Fetch updated crushes details
        const updatedCrushesQuery = `
        SELECT * FROM Users
        WHERE id = ANY($1);
        `;
        const updatedCrushesResult = await pool.query(updatedCrushesQuery, [crushIds]);

        const userData = userResult.rows[0];
        const updatedCrushesData = updatedCrushesResult.rows;

        res.status(200).json({
            msg: 'Crushes updated successfully',
            error: false,
            user: userData,
            updatedCrushes: updatedCrushesData
        });
    } catch (error) {
        console.error('Error updating crushes:', error);
        res.status(500).json({ error: true, msg: 'Unable to update crushes' });
    }
};

module.exports = { addcrush, getUserCrushes, deleteuserCrush, deleteAllUserCrushes, getAllCrushesWithUsers, updateCrushes };