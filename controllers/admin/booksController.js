const { pool } = require('../../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../public/uploads/books');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'book-cover-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

const booksController = {
    index: async (req, res) => {
        let connection;
        try {
            console.log('=== Books Controller Index Started ===');
            connection = await pool.getConnection();
            console.log('Database connection established');
            
            // Test basic database connectivity
            await connection.execute('SELECT 1');
            console.log('Database connectivity test passed');
            
            // Initialize categories if empty
            try {
                const [categoriesCount] = await connection.execute('SELECT COUNT(*) as count FROM categories');
                console.log('Categories count:', categoriesCount[0].count);
                
                if (categoriesCount[0].count === 0) {
                    console.log('Seeding initial categories...');
                    const initialCategories = [
                        ['Fiction', 'fiction'],
                        ['Non-Fiction', 'non-fiction'],
                        ['Science', 'science'],
                        ['Technology', 'technology'],
                        ['History', 'history'],
                        ['Biography', 'biography']
                    ];
                    
                    for (const [name, slug] of initialCategories) {
                        await connection.execute(
                            'INSERT INTO categories (name, slug, created_at) VALUES (?, ?, NOW())',
                            [name, slug]
                        );
                    }
                    console.log('Initial categories seeded successfully');
                }
            } catch (categoryError) {
                console.error('Category initialization error:', categoryError);
                // Continue execution - don't fail completely
            }
            
            // Get all categories for the dropdown
            let categories = [];
            try {
                const [categoriesResult] = await connection.execute('SELECT id, name FROM categories ORDER BY name');
                categories = categoriesResult;
                console.log('Categories loaded:', categories.length);
            } catch (categoryError) {
                console.error('Error loading categories:', categoryError);
                categories = []; // Fallback to empty array
            }
            
            // Get query parameters
            const search = req.query.search || '';
            const category = req.query.category || '';
            const status = req.query.status || '';
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const offset = (page - 1) * limit;
            
            console.log('Query params:', { search, category, status, page, limit, offset });
            
            // Build WHERE conditions
            let whereConditions = [];
            let queryParams = [];
            
            if (search) {
                whereConditions.push('(name LIKE ? OR author LIKE ? OR publisher LIKE ? OR isbn LIKE ?)');
                const searchTerm = `%${search}%`;
                queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }
            
            if (category) {
                whereConditions.push('categorie_id = ?');
                queryParams.push(category);
            }
            
            if (status === 'available') {
                whereConditions.push('is_available = 1');
            } else if (status === 'unavailable') {
                whereConditions.push('is_available = 0');
            }
            
            const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
            console.log('WHERE clause:', whereClause);
            console.log('Query parameters:', queryParams);
            
            // Get total count for pagination
            let totalCount = 0;
            try {
                const countQuery = `SELECT COUNT(*) as count FROM books ${whereClause}`;
                const [countResult] = await connection.execute(countQuery, queryParams);
                totalCount = countResult[0].count;
                console.log('Total books count:', totalCount);
            } catch (countError) {
                console.error('Error getting books count:', countError);
                totalCount = 0;
            }
            
            // Get books data
            let books = [];
            try {
                // Construct the base query
                let booksQuery = `SELECT id, name, author, publisher, isbn, categorie_id, 
                    is_available, is_popular, year_publisher, description, 
                    cover, language, created_at, updated_at 
                    FROM books`;
                
                // Add WHERE clause if conditions exist
                if (whereConditions.length > 0) {
                    booksQuery += ' WHERE ' + whereConditions.join(' AND ');
                }
                
                // Add ORDER BY and LIMIT
                booksQuery += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
                
                console.log('Executing books query:', booksQuery);
                console.log('Books query params:', queryParams);
                
                // Execute query with only search parameters (not limit/offset)
                const [booksResult] = await connection.execute(booksQuery, queryParams);
                console.log('Raw books result:', booksResult.length);
                
                // Log the actual results for debugging
                console.log('Books found:', booksResult);
                
                // Add category names to books
                books = booksResult.map(book => {
                    const category = categories.find(cat => cat.id === book.categorie_id);
                    return {
                        ...book,
                        category_name: category ? category.name : null
                    };
                });
                
                console.log('Books with categories:', books.length);
            } catch (booksError) {
                console.error('Error fetching books:', booksError);
                console.error('Books error stack:', booksError.stack);
                books = [];
            }
            
            const totalPages = Math.ceil(totalCount / limit);
            
            console.log('Rendering page with:', {
                booksCount: books.length,
                categoriesCount: categories.length,
                totalPages,
                currentPage: page
            });
            
            res.render('admin/books/index', {
                title: 'Books Management',
                user: req.session.user,
                path: req.path,
                layout: 'layouts/admin',
                books: books,
                categories: categories,
                currentPage: page,
                totalPages: totalPages,
                search: search,
                category: category,
                status: status,
                messages: {
                    success: req.flash('success'),
                    error: req.flash('error')
                }
            });
            
        } catch (error) {
            console.error('=== CRITICAL ERROR in Books Controller ===');
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            
            // Try to get categories even in error state
            let categories = [];
            try {
                if (connection) {
                    const [categoriesResult] = await connection.execute('SELECT id, name FROM categories ORDER BY name');
                    categories = categoriesResult;
                }
            } catch (categoryError) {
                console.error('Error fetching categories in error handler:', categoryError);
            }
            
            req.flash('error', 'Failed to load books data. Please try again.');
            res.render('admin/books/index', {
                title: 'Books Management',
                user: req.session.user,
                path: req.path,
                layout: 'layouts/admin',
                books: [],
                categories: categories,
                currentPage: 1,
                totalPages: 1,
                search: '',
                category: '',
                status: '',
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
            console.log('=== Books Controller Index Completed ===');
        }
    },

    create: async (req, res) => {
        let connection;
        try {
            console.log('Received form data:', req.body); // Debug log
            const { name, author, publisher, isbn, categorie_id, year_publisher, description, language, is_available, is_popular } = req.body;
            
            // Validate required fields
            if (!name) {
                throw new Error('Book title is required');
            }
            
            // Generate slug from name
            const slug = name.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            
            // Handle cover image upload
            let coverPath = null;
            if (req.file) {
                coverPath = '/uploads/books/' + req.file.filename;
            }
            
            connection = await pool.getConnection();
            
            // Debug log for category
            console.log('Category ID:', categorie_id);
            
            const result = await connection.execute(`
                INSERT INTO books (
                    name, slug, author, publisher, isbn, categorie_id, year_publisher, 
                    description, cover, language, is_available, is_popular, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `, [
                name,
                slug,
                author || null,
                publisher || null,
                isbn || null,
                categorie_id || null,
                year_publisher || null,
                description || null,
                coverPath,
                language || null,
                is_available === 'on' ? 1 : 0,
                is_popular === 'on' ? 1 : 0
            ]);
            
            console.log('Insert result:', result); // Debug log
            
            req.flash('success', 'Book created successfully!');
            res.redirect('/dashboard/books');
        } catch (error) {
            console.error('Create book error:', error);
            
            // Clean up uploaded file if database operation failed
            if (req.file) {
                const filePath = path.join(uploadDir, req.file.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            
            req.flash('error', `Failed to create book: ${error.message}`);
            res.redirect('/dashboard/books');
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },

    update: async (req, res) => {
        let connection;
        try {
            const bookId = req.params.id;
            const { name, author, publisher, isbn, categorie_id, year_publisher, description, language, is_available, is_popular } = req.body;
            
            // Generate slug from name
            const slug = name.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            
            connection = await pool.getConnection();
            
            // Get current book data to retrieve old cover path
            const [currentBook] = await connection.execute('SELECT cover FROM books WHERE id = ?', [bookId]);
            
            let coverPath = currentBook[0]?.cover || null;
            let oldCoverPath = null;
            
            // Handle cover image upload
            if (req.file) {
                oldCoverPath = currentBook[0]?.cover;
                coverPath = '/uploads/books/' + req.file.filename;
            }
            
            await connection.execute(`
                UPDATE books 
                SET name = ?, slug = ?, author = ?, publisher = ?, isbn = ?, categorie_id = ?, 
                    year_publisher = ?, description = ?, cover = ?, language = ?, is_available = ?, is_popular = ?, updated_at = NOW()
                WHERE id = ?
            `, [
                name,
                slug,
                author || null,
                publisher || null,
                isbn || null,
                categorie_id || null,
                year_publisher || null,
                description || null,
                coverPath,
                language || null,
                is_available === 'on' ? 1 : 0,
                is_popular === 'on' ? 1 : 0,
                bookId
            ]);
            
            // Delete old cover file if a new one was uploaded
            if (req.file && oldCoverPath && oldCoverPath.startsWith('/uploads/books/')) {
                const oldFileName = path.basename(oldCoverPath);
                const oldFilePath = path.join(uploadDir, oldFileName);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }
            
            req.flash('success', 'Book updated successfully!');
            res.redirect('/dashboard/books');
        } catch (error) {
            console.error('Update book error:', error);
            
            // Clean up uploaded file if database operation failed
            if (req.file) {
                const filePath = path.join(uploadDir, req.file.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            
            req.flash('error', 'Failed to update book. Please try again.');
            res.redirect('/dashboard/books');
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },

    delete: async (req, res) => {
        let connection;
        try {
            const bookId = req.params.id;
            
            connection = await pool.getConnection();
            
            // Check if book is currently borrowed
            const [loans] = await connection.execute(
                'SELECT id FROM loans WHERE book_id = ? AND status = "borrowed"',
                [bookId]
            );
            
            if (loans.length > 0) {
                req.flash('error', 'Cannot delete book that is currently borrowed.');
                return res.redirect('/dashboard/books');
            }
            
            // Get book cover to delete file
            const [book] = await connection.execute('SELECT cover FROM books WHERE id = ?', [bookId]);
            const coverPath = book[0]?.cover;
            
            await connection.execute('DELETE FROM books WHERE id = ?', [bookId]);
            
            // Delete cover file if it exists
            if (coverPath && coverPath.startsWith('/uploads/books/')) {
                const fileName = path.basename(coverPath);
                const filePath = path.join(uploadDir, fileName);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            
            req.flash('success', 'Book deleted successfully!');
            res.redirect('/dashboard/books');
        } catch (error) {
            console.error('Delete book error:', error);
            req.flash('error', 'Failed to delete book. Please try again.');
            res.redirect('/dashboard/books');
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },

    // Export multer upload middleware
    uploadMiddleware: upload.single('cover')
};

module.exports = booksController;
