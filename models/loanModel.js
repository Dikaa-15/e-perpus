const pool = require('../config/db');

/**
 * Check if user exists and is active
 * @param {number} userId - User ID to check
 * @returns {Promise<Object>} User data if exists and active, null otherwise
 */
const checkUserExists = async (userId) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, name, email, is_active FROM users WHERE id = ? AND is_active = true', 
            [userId]
        );
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        throw new Error(`Error checking user existence: ${error.message}`);
    }
};

/**
 * Check if book exists and get book details
 * @param {number} bookId - Book ID to check
 * @returns {Promise<Object>} Book data if exists, null otherwise
 */
const checkBookExists = async (bookId) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, title, author, stock FROM books WHERE id = ?', 
            [bookId]
        );
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        throw new Error(`Error checking book existence: ${error.message}`);
    }
};

/**
 * Check if book is available for loan (has stock)
 * @param {number} bookId - Book ID to check
 * @returns {Promise<boolean>} True if book is available, false otherwise
 */
const checkBookAvailability = async (bookId) => {
    try {
        const [rows] = await pool.execute(
            `SELECT 
                b.stock,
                COALESCE(COUNT(l.id), 0) as active_loans
             FROM books b
             LEFT JOIN loans l ON b.id = l.book_id AND l.status = 'borrowed'
             WHERE b.id = ?
             GROUP BY b.id, b.stock`,
            [bookId]
        );
        
        if (rows.length === 0) return false;
        
        const { stock, active_loans } = rows[0];
        return stock > active_loans;
    } catch (error) {
        throw new Error(`Error checking book availability: ${error.message}`);
    }
};

/**
 * Check if user already has an active loan for this book
 * @param {number} userId - User ID
 * @param {number} bookId - Book ID
 * @returns {Promise<boolean>} True if user has active loan, false otherwise
 */
const checkUserActiveLoan = async (userId, bookId) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id FROM loans WHERE user_id = ? AND book_id = ? AND status = ?',
            [userId, bookId, 'borrowed']
        );
        return rows.length > 0;
    } catch (error) {
        throw new Error(`Error checking user active loan: ${error.message}`);
    }
};

/**
 * Get user's total active loans count
 * @param {number} userId - User ID
 * @returns {Promise<number>} Number of active loans
 */
const getUserActiveLoanCount = async (userId) => {
    try {
        const [rows] = await pool.execute(
            'SELECT COUNT(*) as count FROM loans WHERE user_id = ? AND status = ?',
            [userId, 'borrowed']
        );
        return rows[0].count;
    } catch (error) {
        throw new Error(`Error getting user active loan count: ${error.message}`);
    }
};

/**
 * Validate loan duration
 * @param {number} loanDuration - Loan duration in days
 * @returns {boolean} True if valid, false otherwise
 */
const validateLoanDuration = (loanDuration) => {
    const duration = parseInt(loanDuration, 10);
    return !isNaN(duration) && duration > 0 && duration <= 30; // Max 30 days
};

/**
 * Create a new loan
 * @param {number} userId - User ID
 * @param {number} bookId - Book ID
 * @param {number} loanDuration - Loan duration in days
 * @returns {Promise<number>} Loan ID
 */
const createLoan = async (userId, bookId, loanDuration) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Set loans_date to current date
        const loansDate = new Date();
        const dueDate = new Date(loansDate);
        dueDate.setDate(dueDate.getDate() + parseInt(loanDuration));
        
        // Format dates for MySQL
        const formattedLoansDate = loansDate.toISOString().slice(0, 10);
        const formattedDueDate = dueDate.toISOString().slice(0, 10);
        
        // Insert loan record
        const [result] = await connection.execute(
            `INSERT INTO loans (user_id, book_id, loans_date, due_date, loan_duration, status, created_at)
             VALUES (?, ?, ?, ?, ?, 'borrowed', NOW())`,
            [userId, bookId, formattedLoansDate, formattedDueDate, parseInt(loanDuration)]
        );
        
        await connection.commit();
        return result.insertId;
        
    } catch (error) {
        await connection.rollback();
        throw new Error(`Error creating loan: ${error.message}`);
    } finally {
        connection.release();
    }
};

/**
 * Get loan details by ID
 * @param {number} loanId - Loan ID
 * @returns {Promise<Object>} Loan details
 */
const getLoanById = async (loanId) => {
    try {
        const [rows] = await pool.execute(
            `SELECT 
                l.*,
                u.name as user_name,
                u.email as user_email,
                b.title as book_title,
                b.author as book_author
             FROM loans l
             JOIN users u ON l.user_id = u.id
             JOIN books b ON l.book_id = b.id
             WHERE l.id = ?`,
            [loanId]
        );
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        throw new Error(`Error getting loan details: ${error.message}`);
    }
};

module.exports = {
    checkUserExists,
    checkBookExists,
    checkBookAvailability,
    checkUserActiveLoan,
    getUserActiveLoanCount,
    validateLoanDuration,
    createLoan,
    getLoanById
};
