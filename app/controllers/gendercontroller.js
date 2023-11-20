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

module.exports = { creategender, updateGender,deleteGender,getAllGenders };