const pool = require('../config/db');

const checkUserExists = async (userId) => {
    const [rows] = await pool.execute('SELECT id FROM users WHERE id = ?', [userId]);
    return rows.length > 0;
};

const checkBookExists = async (bookId) => {
    const [rows] = await pool.execute('SELECT id FROM books WHERE id = ?', [bookId]);
    return rows.length > 0;
};

const checkUserActiveLoan = async (userId, bookId) => {
    const [rows] = await pool.execute(
        'SELECT id FROM loans WHERE user_id = ? AND book_id = ? AND status = ?',
        [userId, bookId, 'borrowed']
    );
    return rows.length > 0;
};

const createLoan = async (userId, bookId, loanDuration) => {
    const loansDate = new Date();
    const dueDate = new Date(loansDate);
    dueDate.setDate(dueDate.getDate() + loanDuration);

    const [result] = await pool.execute(
        `INSERT INTO loans (user_id, book_id, loans_date, due_date, loan_duration, status)
         VALUES (?, ?, ?, ?, ?, 'borrowed')`,
        [userId, bookId, loansDate.toISOString().slice(0, 10), dueDate.toISOString().slice(0, 10), loanDuration]
    );
    return result.insertId;
};

module.exports = {
    checkUserExists,
    checkBookExists,
    checkUserActiveLoan,
    createLoan
};
