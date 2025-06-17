const { pool } = require('../../config/database');

const articlesController = {
    index: async (req, res) => {
        try {
            const connection = await pool.getConnection();
            
            // Get all articles with pagination
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const offset = (page - 1) * limit;
            
            const [articles] = await connection.execute(`
                SELECT 
                    a.id,
                    a.title,
                    a.slug,
                    a.cover,
                    LEFT(a.content, 150) as excerpt,
                    c.name as category_name,
                    a.is_published,
                    a.created_at
                FROM articles a
                LEFT JOIN categories c ON a.categorie_id = c.id
                ORDER BY a.created_at DESC
                LIMIT ? OFFSET ?
            `, [limit, offset]);
            
            const [totalCount] = await connection.execute('SELECT COUNT(*) as count FROM articles');
            const totalPages = Math.ceil(totalCount[0].count / limit);

            // Get categories for filter/add form
            const [categories] = await connection.execute('SELECT id, name FROM categories ORDER BY name');
            
            connection.release();
            
            res.render('admin/articles/index', {
                title: 'Articles Management',
                user: req.session.user,
                path: req.path,
                layout: 'layouts/admin',
                articles: articles,
                categories: categories,
                currentPage: page,
                totalPages: totalPages
            });
        } catch (error) {
            console.error('Articles error:', error);
            res.render('admin/articles/index', {
                title: 'Articles Management',
                user: req.session.user,
                path: req.path,
                layout: 'layouts/admin',
                articles: [],
                categories: [],
                currentPage: 1,
                totalPages: 1
            });
        }
    }
};

module.exports = articlesController;
