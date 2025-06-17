const { pool } = require('../../config/database');

const booksController = {
    index: async (req, res) => {
        try {
            const connection = await pool.getConnection();
            
            // Get all books with pagination
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const offset = (page - 1) * limit;
            
            const [books] = await connection.execute(`
                SELECT 
                    b.id,
                    b.name,
                    b.author,
                    b.publisher,
                    b.isbn,
                    b.is_available,
                    b.is_popular,
                    b.year_publisher,
                    c.name as category_name,
                    b.created_at
                FROM books b
                LEFT JOIN categories c ON b.categorie_id = c.id
                ORDER BY b.created_at DESC
                LIMIT ? OFFSET ?
            `, [limit, offset]);
            
            const [totalCount] = await connection.execute('SELECT COUNT(*) as count FROM books');
            const totalPages = Math.ceil(totalCount[0].count / limit);

            // Get categories for filter/add form
            const [categories] = await connection.execute('SELECT id, name FROM categories ORDER BY name');
            
            connection.release();
            
            res.render('admin/books/index', {
                title: 'Books Management',
                user: req.session.user,
                path: req.path,
                layout: 'layouts/admin',
                books: books,
                categories: categories,
                currentPage: page,
                totalPages: totalPages
            });
        } catch (error) {
            console.error('Books error:', error);
            res.render('admin/books/index', {
                title: 'Books Management',
                user: req.session.user,
                path: req.path,
                layout: 'layouts/admin',
                books: [],
                categories: [],
                currentPage: 1,
                totalPages: 1
            });
        }
    }
};

module.exports = booksController;
