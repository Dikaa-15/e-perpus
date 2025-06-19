const { pool } = require('../config/database');

const dashboardController = {
    index: async (req, res) => {
        try {
            const connection = await pool.getConnection();

            const { filterLoansDate, filterDueDate } = req.query;

            // Get counts for dashboard widgets
            let userCount, bookCount, articleCount;

            if (filterLoansDate) {
                // Count distinct users who have loans on the filterLoansDate
                [userCount] = await connection.execute(
                    `SELECT COUNT(DISTINCT user_id) as count FROM loans WHERE DATE(loans_date) = ?`,
                    [filterLoansDate]
                );
            } else {
                [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
            }

            if (filterDueDate) {
                // Count distinct books that have loans with due_date on the filterDueDate
                [bookCount] = await connection.execute(
                    `SELECT COUNT(DISTINCT book_id) as count FROM loans WHERE DATE(due_date) = ?`,
                    [filterDueDate]
                );
                // Count articles - assuming articles are not loaned, so keep original count
                [articleCount] = await connection.execute('SELECT COUNT(*) as count FROM articles');
            } else {
                [bookCount] = await connection.execute('SELECT COUNT(*) as count FROM books');
                [articleCount] = await connection.execute('SELECT COUNT(*) as count FROM articles');
            }

            // Build latest loans query with optional filters
            let latestLoansQuery = `
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
            `;
            const queryParams = [];
            const conditions = [];

            if (filterLoansDate) {
                conditions.push('DATE(l.loans_date) = ?');
                queryParams.push(filterLoansDate);
            }
            if (filterDueDate) {
                conditions.push('DATE(l.due_date) = ?');
                queryParams.push(filterDueDate);
            }

            if (conditions.length > 0) {
                latestLoansQuery += ' WHERE ' + conditions.join(' AND ');
            }

            latestLoansQuery += ' ORDER BY l.created_at DESC LIMIT 10';

            const [latestLoans] = await connection.execute(latestLoansQuery, queryParams);

            connection.release();

            // If AJAX request, respond with JSON
            if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
                return res.json({
                    stats: {
                        users: userCount[0].count,
                        books: bookCount[0].count,
                        articles: articleCount[0].count
                    },
                    latestLoans: latestLoans
                });
            }

            // Otherwise render the page normally
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
