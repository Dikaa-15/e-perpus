const { pool } = require('../config/database');

const homeController = {
    welcome: async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();

            // Fetch popular books (limit 5)
            const [popularBooks] = await connection.execute(`
                SELECT id, name, author, cover 
                FROM books 
                WHERE is_popular = 1 AND is_available = 1 
                ORDER BY created_at DESC 
                LIMIT 5
            `);

            // Fetch latest articles (limit 5)
            const [latestArticles] = await connection.execute(`
                SELECT id, title, cover, SUBSTRING(content, 1, 150) AS excerpt 
                FROM articles 
                WHERE is_published = 1 
                ORDER BY created_at DESC 
                LIMIT 5
            `);

            res.render('index', {
                title: 'E-Perpustakaan',
                user: req.session.user || null,
                popularBooks,
                latestArticles
            });
        } catch (error) {
            console.error('Error fetching welcome page data:', error);
            res.render('index', {
                title: 'E-Perpustakaan',
                user: req.session.user || null,
                popularBooks: [],
                latestArticles: []
            });
        } finally {
            if (connection) connection.release();
        }
    }
};

module.exports = homeController;
