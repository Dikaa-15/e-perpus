const { pool } = require('../../config/database');
const ExcelJS = require('exceljs');

const ITEMS_PER_PAGE = 10;

exports.index = async (req, res) => {
    let connection;
    try {
        console.log('=== Loans Controller Index Started ===');
        connection = await pool.getConnection();
        console.log('Database connection established');

        // Test basic database connectivity
        await connection.execute('SELECT 1');
        console.log('Database connectivity test passed');

        // Fetch users and books for dropdowns
        let users = [];
        let books = [];
        try {
            const [usersResult] = await connection.execute('SELECT id, name FROM users WHERE is_active = 1 ORDER BY name');
            users = usersResult;
            console.log('Users loaded:', users.length);
        } catch (userError) {
            console.error('Error loading users:', userError);
            users = [];
        }

        try {
            const [booksResult] = await connection.execute('SELECT id, name FROM books WHERE is_available = 1 ORDER BY name');
            books = booksResult;
            console.log('Books loaded:', books.length);
        } catch (bookError) {
            console.error('Error loading books:', bookError);
            books = [];
        }

        // Get query parameters
        const search = req.query.search ? req.query.search.trim() : '';
        const status = req.query.status || '';
        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        console.log('Query params:', { search, status, startDate, endDate, page, limit, offset });

        // Build WHERE conditions
        let whereConditions = [];
        let queryParams = [];

        if (search) {
            whereConditions.push('(u.name LIKE ? OR b.name LIKE ?)');
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm);
        }

        if (status) {
            whereConditions.push('l.status = ?');
            queryParams.push(status);
        }

        if (startDate) {
            whereConditions.push('l.loans_date >= ?');
            queryParams.push(startDate);
        }

        if (endDate) {
            whereConditions.push('l.loans_date <= ?');
            queryParams.push(endDate);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
        console.log('WHERE clause:', whereClause);
        console.log('Query parameters:', queryParams);

        // Get total count for pagination
        let totalCount = 0;
        try {
            const countQuery = `
                SELECT COUNT(*) as count
                FROM loans l
                LEFT JOIN users u ON l.user_id = u.id
                LEFT JOIN books b ON l.book_id = b.id
                ${whereClause}
            `;
            const [countResult] = await connection.execute(countQuery, queryParams);
            totalCount = countResult[0].count;
            console.log('Total loans count:', totalCount);
        } catch (countError) {
            console.error('Error getting loans count:', countError);
            totalCount = 0;
        }

        // Get loans data
        let loans = [];
        try {
            // MySQL does not support placeholders for LIMIT and OFFSET in prepared statements in some versions
            // So we embed limit and offset directly after validating they are integers
            const safeLimit = parseInt(limit, 10);
            const safeOffset = parseInt(offset, 10);

            let loansQuery = `
                SELECT l.*, u.name as user_name, b.name as book_name
                FROM loans l
                LEFT JOIN users u ON l.user_id = u.id
                LEFT JOIN books b ON l.book_id = b.id
                ${whereClause}
                ORDER BY l.created_at DESC
                LIMIT ${safeLimit} OFFSET ${safeOffset}
            `;
            const loansParams = [...queryParams];
            const [loansResult] = await connection.execute(loansQuery, loansParams);
            loans = loansResult;
            console.log('Loans found:', loans.length);
        } catch (loansError) {
            console.error('Error fetching loans:', loansError);
            loans = [];
        }

        const totalPages = Math.ceil(totalCount / limit);

        console.log('Rendering page with:', {
            loansCount: loans.length,
            usersCount: users.length,
            booksCount: books.length,
            totalPages,
            currentPage: page
        });

        res.render('admin/loans/index', {
            title: 'Loans Managements',
            user: req.session.user,
            path: req.path,
            loans : loans,
            users : users,
            layout: 'layouts/admin',
            books : books, 
            currentPage: page,
            totalPages : totalPages,
            search : search,
            status : status,
            startDate : startDate,
            endDate : endDate,
            messages: {
                success: req.flash('success'),
                error: req.flash('error')
            }
        });

    } catch (error) {
        console.error('=== CRITICAL ERROR in Loans Controller ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        // Try to get users and books even in error state
        let users = [];
        let books = [];
        try {
            if (connection) {
                const [usersResult] = await connection.execute('SELECT id, name FROM users WHERE is_active = 1 ORDER BY name');
                users = usersResult;
                const [booksResult] = await connection.execute('SELECT id, name FROM books WHERE is_available = 1 ORDER BY name');
                books = booksResult;
            }
        } catch (fetchError) {
            console.error('Error fetching users or books in error handler:', fetchError);
        }

        req.flash('error', 'Failed to load loans data. Please try again.');
        res.render('admin/loans/index', {
            loans: [],
            users: users,
            books: books,
            currentPage: 1,
            totalPages: 1,
            search: '',
            status: '',
            startDate: '',
            endDate: '',
            messages: {
                success: req.flash('success'),
                error: req.flash('error')
            }
        });
    } finally {
        if (connection) {
            console.log('Releasing database connection');
            connection.release();
        }
        console.log('=== Loans Controller Index Completed ===');
    }
};

exports.exportExcel = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        // Get query parameters for filtering
        const search = req.query.search ? req.query.search.trim() : '';
        const status = req.query.status || '';
        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';

        // Build WHERE conditions
        let whereConditions = [];
        let queryParams = [];

        if (search) {
            whereConditions.push('(u.name LIKE ? OR b.name LIKE ?)');
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm);
        }

        if (status) {
            whereConditions.push('l.status = ?');
            queryParams.push(status);
        }

        if (startDate) {
            whereConditions.push('l.loans_date >= ?');
            queryParams.push(startDate);
        }

        if (endDate) {
            whereConditions.push('l.loans_date <= ?');
            queryParams.push(endDate);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        // Fetch all loans data without pagination
        const loansQuery = `
            SELECT l.*, u.name as user_name, b.name as book_name
            FROM loans l
            LEFT JOIN users u ON l.user_id = u.id
            LEFT JOIN books b ON l.book_id = b.id
            ${whereClause}
            ORDER BY l.created_at DESC
        `;
        const [loans] = await connection.execute(loansQuery, queryParams);

        // Create a new workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Loans');

        // Define columns
        worksheet.columns = [
            { header: 'User', key: 'user_name', width: 30 },
            { header: 'Book', key: 'book_name', width: 30 },
            { header: 'Loan Date', key: 'loans_date', width: 15 },
            { header: 'Return Date', key: 'return_date', width: 15 },
            { header: 'Due Date', key: 'due_date', width: 15 },
            { header: 'Status', key: 'status', width: 15 }
        ];

        // Add rows
        loans.forEach(loan => {
            worksheet.addRow({
                user_name: loan.user_name || '-',
                book_name: loan.book_name || '-',
                loans_date: loan.loans_date ? new Date(loan.loans_date).toLocaleDateString('id-ID') : '-',
                return_date: loan.return_date ? new Date(loan.return_date).toLocaleDateString('id-ID') : '-',
                due_date: loan.due_date ? new Date(loan.due_date).toLocaleDateString('id-ID') : '-',
                status: loan.status ? loan.status.charAt(0).toUpperCase() + loan.status.slice(1) : '-'
            });
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=loans.xlsx');

        // Write to buffer and send
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error exporting loans to Excel:', error);
        req.flash('error', 'Failed to export loans to Excel.');
        res.redirect('/dashboard/loans');
    } finally {
        if (connection) connection.release();
    }
};

exports.create = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        const { user_id, book_id, quantity, loans_date, due_date, status } = req.body;

        if (!user_id || !book_id || !quantity || !loans_date || !due_date || !status) {
            req.flash('error', 'Please fill in all required fields.');
            return res.redirect('/dashboard/loans');
        }

        // Insert new loan
        await connection.execute(
            `INSERT INTO loans (user_id, book_id, quantity, loans_date, due_date, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [user_id, book_id, quantity, loans_date, due_date, status]
        );

        req.flash('success', 'Loan created successfully.');
        res.redirect('/dashboard/loans');
    } catch (error) {
        console.error('Error creating loan:', error);
        req.flash('error', 'Failed to create loan.');
        res.redirect('/dashboard/loans');
    } finally {
        if (connection) connection.release();
    }
};

exports.update = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        const loanId = req.params.id;
        let { user_id, book_id, quantity, loans_date, return_date, due_date, status } = req.body;

        if (!user_id || !book_id || !quantity || !loans_date || !due_date || !status) {
            req.flash('error', 'Please fill in all required fields.');
            return res.redirect('/dashboard/loans');
        }

        // If status is returned and return_date is empty, set return_date to current date
        if (status === 'returned' && (!return_date || return_date.trim() === '')) {
            const now = new Date();
            return_date = now.toISOString().split('T')[0];
        }

        await connection.execute(
            `UPDATE loans SET user_id = ?, book_id = ?, quantity = ?, loans_date = ?, return_date = ?, due_date = ?, status = ?, updated_at = NOW()
             WHERE id = ?`,
            [user_id, book_id, quantity, loans_date, return_date || null, due_date, status, loanId]
        );

        req.flash('success', 'Loan updated successfully.');
        res.redirect('/dashboard/loans');
    } catch (error) {
        console.error('Error updating loan:', error);
        req.flash('error', 'Failed to update loan.');
        res.redirect('/dashboard/loans');
    } finally {
        if (connection) connection.release();
    }
};

exports.delete = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        const loanId = req.params.id;

        await connection.execute('DELETE FROM loans WHERE id = ?', [loanId]);

        req.flash('success', 'Loan deleted successfully.');
        res.redirect('/dashboard/loans');
    } catch (error) {
        console.error('Error deleting loan:', error);
        req.flash('error', 'Failed to delete loan.');
        res.redirect('/dashboard/loans');
    } finally {
        if (connection) connection.release();
    }
};
