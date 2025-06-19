const { pool } = require('../config/database');

const userDashboardController = {
    index: async (req, res) => {
        try {
            const userId = req.session.userId;
            const connection = await pool.getConnection();
            
            // Get user's active loans
            const [activeLoans] = await connection.execute(`
                SELECT 
                    l.id,
                    l.loans_date,
                    l.due_date,
                    l.status,
                    l.created_at,
                    b.name as book_title,
                    b.author as book_author,
                    b.cover as book_cover,
                    c.name as category_name,
                    DATEDIFF(l.due_date, CURDATE()) as days_remaining
                FROM loans l
                JOIN books b ON l.book_id = b.id
                LEFT JOIN categories c ON b.categorie_id = c.id
                WHERE l.user_id = ? AND l.status = 'borrowed'
                ORDER BY l.due_date ASC
            `, [userId]);
            
            // Get user's loan history
            const [loanHistory] = await connection.execute(`
                SELECT 
                    l.id,
                    l.loans_date,
                    l.due_date,
                    l.return_date,
                    l.status,
                    b.name as book_title,
                    b.author as book_author,
                    b.cover as book_cover,
                    c.name as category_name
                FROM loans l
                JOIN books b ON l.book_id = b.id
                LEFT JOIN categories c ON b.categorie_id = c.id
                WHERE l.user_id = ? AND l.status IN ('returned', 'overdue')
                ORDER BY l.created_at DESC
                LIMIT 10
            `, [userId]);
            
            // Get user statistics
            const [userStats] = await connection.execute(`
                SELECT 
                    COUNT(CASE WHEN status = 'borrowed' THEN 1 END) as active_loans,
                    COUNT(CASE WHEN status = 'returned' THEN 1 END) as returned_books,
                    COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_books,
                    COUNT(*) as total_loans
                FROM loans 
                WHERE user_id = ?
            `, [userId]);
            
            connection.release();
            
            res.render('dashboard/user', {
                title: 'Dashboard Saya',
                user: req.session.user,
                activeLoans: activeLoans,
                loanHistory: loanHistory,
                stats: userStats[0] || {
                    active_loans: 0,
                    returned_books: 0,
                    overdue_books: 0,
                    total_loans: 0
                }
            });
        } catch (error) {
            console.error('User dashboard error:', error);
            res.render('dashboard/user', {
                title: 'Dashboard Saya',
                user: req.session.user,
                activeLoans: [],
                loanHistory: [],
                stats: {
                    active_loans: 0,
                    returned_books: 0,
                    overdue_books: 0,
                    total_loans: 0
                }
            });
        }
    },

    // Return a book
    returnBook: async (req, res) => {
        try {
            const { loanId } = req.params;
            const userId = req.session.userId;
            const connection = await pool.getConnection();
            
            // Verify the loan belongs to the user
            const [loan] = await connection.execute(
                'SELECT id, user_id, status FROM loans WHERE id = ? AND user_id = ?',
                [loanId, userId]
            );
            
            if (loan.length === 0) {
                connection.release();
                return res.status(404).json({
                    success: false,
                    error: 'Loan not found'
                });
            }
            
            if (loan[0].status !== 'borrowed') {
                connection.release();
                return res.status(400).json({
                    success: false,
                    error: 'Book is not currently borrowed'
                });
            }
            
            // Get loan details to check if it's late
            const [loanDetails] = await connection.execute(
                'SELECT due_date FROM loans WHERE id = ?',
                [loanId]
            );

            const dueDate = new Date(loanDetails[0].due_date);
            const currentDate = new Date();
            const isLate = currentDate > dueDate;

            // Update loan status to returned
            await connection.execute(
                'UPDATE loans SET status = "returned", return_date = CURDATE() WHERE id = ?',
                [loanId]
            );
            
            connection.release();

            // Set appropriate flash message
            if (isLate) {
                req.flash('lateReturn', true);
            } else {
                req.flash('successReturn', true);
            }
            
            res.json({
                success: true,
                message: 'Book returned successfully',
                isLate: isLate
            });
            
        } catch (error) {
            console.error('Return book error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to return book'
            });
        }
    }
};

module.exports = userDashboardController;
