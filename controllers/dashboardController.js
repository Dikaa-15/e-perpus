const { pool } = require('../config/database');

const dashboardController = {
    index: async (req, res) => {
        try {
            const connection = await pool.getConnection();
            
            // Get counts for dashboard widgets
            const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
            const [bookCount] = await connection.execute('SELECT COUNT(*) as count FROM books');
            const [articleCount] = await connection.execute('SELECT COUNT(*) as count FROM articles');
            
            // Get latest loans with user and book information
            const [latestLoans] = await connection.execute(`
                SELECT 
                    l.id,
                    u.name as user_name,
                    b.name as book_name,
                    l.loans_date,
                    l.due_date,
                    l.return_date,
                    l.status
                FROM loans l
                JOIN users u ON l.user_id = u.id
                JOIN books b ON l.book_id = b.id
                ORDER BY l.created_at DESC
                LIMIT 10
            `);
            
            connection.release();
            
            res.render('dashboard/index', {
                title: 'Dashboard',
                user: req.session.user,
                path: req.path,
                layout: 'layouts/admin',
                stats: {
                    users: userCount[0].count,
                    books: bookCount[0].count,
                    articles: articleCount[0].count
                },
                latestLoans: latestLoans
            });
        } catch (error) {
            console.error('Dashboard error:', error);
            res.render('dashboard/index', {
                title: 'Dashboard',
                user: req.session.user,
                path: req.path,
                layout: 'layouts/admin',
                stats: {
                    users: 0,
                    books: 0,
                    articles: 0
                },
                latestLoans: []
            });
        }
    }
};

module.exports = dashboardController;
