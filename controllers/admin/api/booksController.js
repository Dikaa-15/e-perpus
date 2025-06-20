const { pool } = require('../../../config/database');

const booksApiController = {
    index: async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();
            const [books] = await connection.execute(
                'SELECT id, name, author FROM books WHERE is_available = 1 ORDER BY name'
            );
            res.json(books);
        } catch (error) {
            console.error('Error fetching books:', error);
            res.status(500).json({ error: 'Failed to fetch books' });
        } finally {
            if (connection) connection.release();
        }
    }
};

module.exports = booksApiController;
