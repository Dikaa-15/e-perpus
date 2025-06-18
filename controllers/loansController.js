const loanModel = require('../models/loanModel');

/**
 * Create a new loan for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createLoan = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { book_id, loans_date, loan_duration, due_date, purpose } = req.body;

        // Input validation
        if (!book_id || !loans_date || !loan_duration || !due_date) {
            return res.status(400).json({ 
                success: false,
                error: 'Missing required fields',
                details: {
                    book_id: !book_id ? 'Book ID is required' : null,
                    loans_date: !loans_date ? 'Loan date is required' : null,
                    loan_duration: !loan_duration ? 'Loan duration is required' : null,
                    due_date: !due_date ? 'Due date is required' : null
                }
            });
        }

        // Validate dates
        const currentDate = new Date().toISOString().split('T')[0];
        if (loans_date < currentDate) {
            return res.status(400).json({
                success: false,
                error: 'Invalid loan date',
                details: 'Loan date cannot be in the past'
            });
        }

        // Validate due date is after loan date
        if (due_date <= loans_date) {
            return res.status(400).json({
                success: false,
                error: 'Invalid due date',
                details: 'Due date must be after loan date'
            });
        }

        // Validate loan duration
        if (!loanModel.validateLoanDuration(loan_duration)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid loan duration',
                details: 'Loan duration must be a positive integer between 1 and 30 days'
            });
        }

        const bookIdNum = parseInt(book_id, 10);
        const loanDurationNum = parseInt(loan_duration, 10);

        if (isNaN(bookIdNum) || bookIdNum <= 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid book ID',
                details: 'Book ID must be a positive integer'
            });
        }

        // Check if user exists and is active
        const user = await loanModel.checkUserExists(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found or inactive',
                details: 'User account does not exist or has been deactivated'
            });
        }

        // Check if book exists
        const book = await loanModel.checkBookExists(bookIdNum);
        if (!book) {
            return res.status(404).json({ 
                success: false,
                error: 'Book not found',
                details: 'The requested book does not exist in our library'
            });
        }

        // Check book availability (stock vs active loans)
        const isBookAvailable = await loanModel.checkBookAvailability(bookIdNum);
        if (!isBookAvailable) {
            return res.status(400).json({ 
                success: false,
                error: 'Book not available',
                details: 'All copies of this book are currently on loan'
            });
        }

        // Check if user already has an active loan for this book
        const hasActiveLoan = await loanModel.checkUserActiveLoan(userId, bookIdNum);
        if (hasActiveLoan) {
            return res.status(400).json({ 
                success: false,
                error: 'Duplicate loan',
                details: 'You already have an active loan for this book'
            });
        }

        // Check user's total active loans (optional: limit to 5 books per user)
        const activeLoanCount = await loanModel.getUserActiveLoanCount(userId);
        const MAX_LOANS_PER_USER = 5;
        
        if (activeLoanCount >= MAX_LOANS_PER_USER) {
            return res.status(400).json({ 
                success: false,
                error: 'Loan limit exceeded',
                details: `You have reached the maximum limit of ${MAX_LOANS_PER_USER} active loans`
            });
        }

        // Create loan with all fields
        const loanId = await loanModel.createLoan(userId, bookIdNum, loans_date, loanDurationNum, due_date, purpose);

        // Get loan details for response
        const loanDetails = await loanModel.getLoanById(loanId);

        return res.status(201).json({ 
            success: true,
            message: 'Loan created successfully',
            data: {
                loan_id: loanId,
                user_name: user.name,
                book_title: book.title,
                book_author: book.author,
                loans_date: loanDetails.loans_date,
                due_date: loanDetails.due_date,
                loan_duration: loanDurationNum,
                status: 'borrowed'
            }
        });

    } catch (error) {
        console.error('Error creating loan:', error);
        
        // Handle specific database errors
        if (error.message.includes('foreign key constraint')) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid reference',
                details: 'User ID or Book ID does not exist'
            });
        }

        return res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            details: 'An unexpected error occurred while processing your request'
        });
    }
};

/**
 * Get loan details by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getLoan = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.userId;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid loan ID',
                details: 'Loan ID must be a valid number'
            });
        }

        const loan = await loanModel.getLoanById(parseInt(id));
        
        if (!loan) {
            return res.status(404).json({ 
                success: false,
                error: 'Loan not found',
                details: 'The requested loan does not exist'
            });
        }

        // Check if user owns this loan (for security)
        if (loan.user_id !== userId) {
            return res.status(403).json({ 
                success: false,
                error: 'Access denied',
                details: 'You can only view your own loans'
            });
        }

        return res.status(200).json({ 
            success: true,
            data: loan
        });

    } catch (error) {
        console.error('Error getting loan:', error);
        return res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            details: 'An unexpected error occurred while retrieving loan details'
        });
    }
};

module.exports = {
    createLoan,
    getLoan
};
