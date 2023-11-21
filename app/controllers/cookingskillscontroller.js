const pool = require("../config/dbconfig")

const addCookingskill = async (req, res) => {
    try {
        const { cooking_skill } = req.body;
        const newRelationship = await pool.query(
            'INSERT INTO Cookingskill (cooking_skill) VALUES ($1) RETURNING *',
            [cooking_skill]
        );
        res.json({
            msg: 'Cooking skill added successfully',
            error: false,
            data: newRelationship.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const updatecookingskill = async (req, res) => {
    try {
        const { id } = req.params; // Get the ID from the URL parameters
        const { cooking_skill } = req.body;

        const updatedcookingskill = await pool.query(
            'UPDATE Cookingskill SET cooking_skill = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [cooking_skill, id]
        );

        if (updatedcookingskill.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Cooking skill not found' });
        }

        res.json({
            msg: 'Cooking skill updated successfully',
            error: false,
            data: updatedcookingskill.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const deleteCookingskill = async (req, res) => {
    try {
        const { id } = req.params; // Get the ID from the URL parameters

        const deletedCookingskill = await pool.query(
            'DELETE FROM Cookingskill WHERE id = $1 RETURNING *',
            [id]
        );

        if (deletedCookingskill.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Cokking skill not found' });
        }

        res.json({
            msg: 'Deleted successfully',
            error: false,
            data: deletedCookingskill.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const getAllcookingskill = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    // Calculate the OFFSET based on the page and limit
    const offset = (page - 1) * limit;

    try {
        let query = `
        SELECT *
        FROM Cookingskill
      `;

        // Check if pagination parameters are provided
        if (page && limit) {
            query += `
          OFFSET ${offset}
          LIMIT ${limit}
        `;
        }

        const result = await pool.query(query);

        const cookingskill = result.rows;
        return res.status(200).json({
            msg: 'Fetched successfully',
            error: false,
            count: cookingskill.length,
            data: cookingskill,
        });
    } catch (error) {
        console.error('Error fetching cooking skill:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
};

module.exports = { addCookingskill, updatecookingskill, deleteCookingskill, getAllcookingskill };