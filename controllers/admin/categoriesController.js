const { pool } = require('../../config/database');

const categoriesController = {
    index: async (req, res) => {
        try {
            const connection = await pool.getConnection();
            
            // Get all categories with pagination and book counts
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const offset = (page - 1) * limit;
            
            const [categories] = await connection.execute(`
                SELECT 
                    c.id,
                    c.name,
                    c.slug,
                    c.created_at,
                    COUNT(DISTINCT b.id) as book_count,
                    COUNT(DISTINCT a.id) as article_count
                FROM categories c
                LEFT JOIN books b ON c.id = b.categorie_id
                LEFT JOIN articles a ON c.id = a.categorie_id
                GROUP BY c.id
                ORDER BY c.created_at DESC
                LIMIT ? OFFSET ?
            `, [limit, offset]);
            
            const [totalCount] = await connection.execute('SELECT COUNT(*) as count FROM categories');
            const totalPages = Math.ceil(totalCount[0].count / limit);
            
            connection.release();
            
            res.render('admin/categories/index', {
                title: 'Categories Management',
                user: req.session.user,
                path: req.path,
                layout: 'layouts/admin',
                categories: categories,
                currentPage: page,
                totalPages: totalPages
            });
        } catch (error) {
            console.error('Categories error:', error);
            res.render('admin/categories/index', {
                title: 'Categories Management',
                user: req.session.user,
                path: req.path,
                layout: 'layouts/admin',
                categories: [],
                currentPage: 1,
                totalPages: 1
            });
        }
    }
};

module.exports = categoriesController;
