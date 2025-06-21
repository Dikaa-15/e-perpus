const { pool } = require('../config/database');

const userController = {
    index: async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();

            // Fetch latest books (limit 10)
            const [books] = await connection.execute(
                'SELECT id, name, author, cover FROM books ORDER BY created_at DESC LIMIT 10'
            );

            // Fetch audiobooks (limit 10) by category name 'Audiobooks'
            // Temporarily fetch latest books as audiobooks to ensure data display
        const [audiobooks] = await connection.execute(
            'SELECT id, name, author, cover FROM books ORDER BY created_at DESC LIMIT 10'
        );

        // Fetch latest articles (limit 10)
        const [articles] = await connection.execute(
                'SELECT id, title, content AS excerpt, cover FROM articles ORDER BY created_at DESC LIMIT 10'
            );

            res.render('user', {
                title: 'User Page',
                user: req.session.user,
                books: books,
                audiobooks: audiobooks,
                articles: articles
            });
        } catch (error) {
            console.error('Error fetching user page data:', error);
            res.status(500).send('Internal Server Error');
        } finally {
            if (connection) connection.release();
        }
    }
};

module.exports = userController;
