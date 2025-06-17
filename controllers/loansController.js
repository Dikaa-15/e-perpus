const loanModel = require('../models/loanModel');

const createLoan = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { book_id, loan_duration } = req.body;

        // Validate input
        if (!book_id || !loan_duration) {
            return res.status(400).json({ error: 'book_id and loan_duration are required' });
        }
        const loanDurationNum = parseInt(loan_duration, 10);
        if (isNaN(loanDurationNum) || loanDurationNum <= 0) {
            return res.status(400).json({ error: 'loan_duration must be a positive integer' });
        }

        // Check if user exists
        const userExists = await loanModel.checkUserExists(userId);
        if (!userExists) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if book exists
        const bookExists = await loanModel.checkBookExists(book_id);
        if (!bookExists) {
            return res.status(404).json({ error: 'Book not found' });
        }

        // Check if user already has an active loan for this book
        const hasActiveLoan = await loanModel.checkUserActiveLoan(userId, book_id);
        if (hasActiveLoan) {
            return res.status(400).json({ error: 'User already has an active loan for this book' });
        }

        // Create loan
        const loanId = await loanModel.createLoan(userId, book_id, loanDurationNum);

        return res.status(201).json({ message: 'Loan created successfully', loan_id: loanId });
    } catch (error) {
        console.error('Error creating loan:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createLoan
};
