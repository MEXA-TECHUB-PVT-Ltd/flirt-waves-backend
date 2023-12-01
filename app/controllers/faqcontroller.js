const pool = require("../config/dbconfig")

const addFAQ = async (req, res) => {
    try {
        const { question, answer } = req.body;
        const newFAQ = await pool.query(
            'INSERT INTO Faqs (question, answer) VALUES ($1, $2) RETURNING *',
            [question, answer]
        );
        res.json({
            msg: 'FAQ added successfully',
            error: false,
            data: newFAQ.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const updateFAQ = async (req, res) => {
    try {
        const { id } = req.params; // Get the ID from the URL parameters
        const { question, answer } = req.body;

        const updatedFAQ = await pool.query(
            'UPDATE Faqs SET question = $1, answer = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
            [question, answer, id]
        );

        if (updatedFAQ.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'FAQ not found' });
        }

        res.json({
            msg: 'FAQ updated successfully',
            error: false,
            data: updatedFAQ.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const deleteFAQ = async (req, res) => {
    try {
        const { id } = req.params; // Get the ID from the URL parameters

        const deletedFAQ = await pool.query(
            'DELETE FROM Faqs WHERE id = $1 RETURNING *',
            [id]
        );

        if (deletedFAQ.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'FAQ not found' });
        }

        res.json({
            msg: 'FAQ deleted successfully',
            error: false,
            data: deletedFAQ.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const getAllFAQs = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    // Calculate the OFFSET based on the page and limit
    const offset = (page - 1) * limit;

    try {
        let query = `
        SELECT *
        FROM Faqs
      `;

        // Check if pagination parameters are provided
        if (page && limit) {
            query += `
          OFFSET ${offset}
          LIMIT ${limit}
        `;
        }

        const result = await pool.query(query);

        const FAQs = result.rows;
        return res.status(200).json({
            msg: 'All FAQs fetched successfully',
            error: false,
            count: FAQs.length,
            data: FAQs,
        });
    } catch (error) {
        console.error('Error fetching FAQs:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
};


const getFAQByID = async (req, res) => {
    const faqID = req.params.id; // Assuming the ID is passed in the request parameters

    try {
        const query = `
            SELECT *
            FROM Faqs
            WHERE id = $1
        `;

        const result = await pool.query(query, [faqID]);

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'FAQ not found', error: true });
        }

        const faq = result.rows[0];
        return res.status(200).json({
            msg: 'FAQ fetched successfully',
            error: false,
            data: faq,
        });
    } catch (error) {
        console.error('Error fetching FAQ:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
}; 

module.exports = { addFAQ, updateFAQ, deleteFAQ, getAllFAQs, getFAQByID };