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
      VALUES ${crushIds.map((_, index) => `($1, $${index + 2})`).join(',')}
      ON CONFLICT DO NOTHING;`;

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

    try {
        // Check if the user ID exists
        const userExistsQuery = 'SELECT COUNT(*) AS count FROM Users WHERE id = $1';
        const userExistsResult = await pool.query(userExistsQuery, [userId]);

        if (parseInt(userExistsResult.rows[0].count) === 0) {
            return res.status(400).json({ error: true, msg: 'User ID does not exist' });
        }

        // Retrieve crushes of the user
        const userCrushesQuery = `
            SELECT u.* FROM Users u
            JOIN userscrushes uc ON uc.crush_id = u.id
            WHERE uc.user_id = $1;
        `;
        const userCrushesResult = await pool.query(userCrushesQuery, [userId]);

        const userCrushesData = userCrushesResult.rows;

        res.status(200).json({
            msg: 'Retrieved user crushes successfully',
            error: false,
            userCrushes: userCrushesData
        });
    } catch (error) {
        console.error('Error retrieving user crushes:', error);
        res.status(500).json({ error: true, msg: 'Unable to retrieve user crushes' });
    }
};

module.exports = { addcrush, getUserCrushes };