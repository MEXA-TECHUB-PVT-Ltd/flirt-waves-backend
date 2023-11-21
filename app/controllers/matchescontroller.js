const pool = require("../config/dbconfig")

const calculateMatchValue = async (req, res) => {
    const { user1_id, user2_id } = req.body;
  
    try {
      // Check if user IDs exist in the Users table
      const user1Exist = await pool.query('SELECT EXISTS(SELECT 1 FROM Users WHERE id = $1)', [user1_id]);
      const user2Exist = await pool.query('SELECT EXISTS(SELECT 1 FROM Users WHERE id = $1)', [user2_id]);
  
      // If either user ID doesn't exist, return an error
      if (!user1Exist.rows[0].exists || !user2Exist.rows[0].exists) {
        return res.status(404).json({ error: true, msg: 'User not found' });
      }
  
      // Fetch user attributes from the Users table based on user IDs
      const user1Details = await pool.query('SELECT * FROM Users WHERE id = $1', [user1_id]);
      const user2Details = await pool.query('SELECT * FROM Users WHERE id = $1', [user2_id]);
  
      // Define attributes to compare
      const attributesToCompare = [
        'looking_for',
        'height',
        'exercise',
        'cooking_skills',
        'explains_you',
        'night_life',
        'opinion_on_smoking',
        'about_kids',
        'eating_habits',
        // Add more attributes as needed
      ];
  
      // Calculate match value based on matching attribute values
      let match_value = 0;
      attributesToCompare.forEach(attribute => {
        if (user1Details.rows[0][attribute] && user2Details.rows[0][attribute] && user1Details.rows[0][attribute] === user2Details.rows[0][attribute]) {
          match_value++;
        }
      });
  
      // Insert match details into the Matches table
      await pool.query(
        'INSERT INTO Matches (user1_id, user2_id, match_value) VALUES ($1, $2, $3)',
        [user1_id, user2_id, match_value]
      );
  
      res.status(200).json({
        error: false,
        match_value,
        user1: user1Details.rows[0],
        user2: user2Details.rows[0]
      });
    } catch (error) {
      console.error('Error calculating match:', error);
      res.status(500).json({ error: true, msg: 'Internal Server Error' });
    }
  };
    
module.exports = { calculateMatchValue };