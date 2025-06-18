const { pool } = require('../../config/database');

const categoriesController = {
    index: async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();
            
            // Get search parameters
            const search = req.query.search || '';
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const offset = (page - 1) * limit;
            
            // Build WHERE clause for search
            let whereClause = 'WHERE 1=1';
            let queryParams = [];
            
            if (search) {
                whereClause += ' AND (c.name LIKE ? OR c.slug LIKE ?)';
                const searchTerm = `%${search}%`;
                queryParams.push(searchTerm, searchTerm);
            }
            
            // Get categories with search, pagination and counts
            const categoriesQuery = `
                SELECT c.id, c.name, c.slug, c.created_at, 
                       COUNT(DISTINCT b.id) as book_count, 
                       COUNT(DISTINCT a.id) as article_count 
                FROM categories c 
                LEFT JOIN books b ON c.id = b.categorie_id 
                LEFT JOIN articles a ON c.id = a.categorie_id 
                ${whereClause} 
                GROUP BY c.id, c.name, c.slug, c.created_at 
                ORDER BY c.created_at DESC 
                LIMIT ${limit} OFFSET ${offset}
            `;
            
            console.log('Query params:', queryParams); // Debug log
            const [categories] = await connection.execute(categoriesQuery, queryParams);
            
            // Get total count for pagination - reuse same queryParams
            const countQuery = `
                SELECT COUNT(DISTINCT c.id) as count 
                FROM categories c
                ${whereClause}
            `;
            
            const [totalCount] = await connection.execute(countQuery, queryParams);
            
            const totalPages = Math.ceil(totalCount[0].count / limit);
            
            res.render('admin/categories/index', {
                title: 'Categories Management',
                user: req.session.user,
                path: req.path,
                layout: 'layouts/admin',
                categories: categories,
                currentPage: page,
                totalPages: totalPages,
                search: search,
                messages: {
                    success: req.flash('success'),
                    error: req.flash('error')
                }
            });
        } catch (error) {
            console.error('Categories error:', error);
            req.flash('error', 'Failed to fetch categories: ' + error.message);
            res.render('admin/categories/index', {
                title: 'Categories Management',
                user: req.session.user,
                path: req.path,
                layout: 'layouts/admin',
                categories: [],
                currentPage: 1,
                totalPages: 1,
                search: '',
                messages: {
                    success: req.flash('success'),
                    error: req.flash('error')
                }
            });
        } finally {
            if (connection) connection.release();
        }
    },

    create: async (req, res) => {
        try {
            const { name } = req.body;
            
            // Generate slug from name
            const slug = name.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            
            const connection = await pool.getConnection();
            
            // Check if category with same name/slug exists
            const [existing] = await connection.execute(
                'SELECT id FROM categories WHERE name = ? OR slug = ?',
                [name, slug]
            );
            
            if (existing.length > 0) {
                req.flash('error', 'Category with this name already exists.');
                connection.release();
                return res.redirect('/dashboard/categories');
            }
            
            // Create new category
            await connection.execute(
                'INSERT INTO categories (name, slug, created_at) VALUES (?, ?, NOW())',
                [name, slug]
            );
            
            connection.release();
            
            req.flash('success', 'Category created successfully!');
            res.redirect('/dashboard/categories');
        } catch (error) {
            console.error('Create category error:', error);
            req.flash('error', 'Failed to create category. Please try again.');
            res.redirect('/dashboard/categories');
        }
    },

    update: async (req, res) => {
        try {
            const categoryId = req.params.id;
            const { name } = req.body;
            
            // Generate slug from name
            const slug = name.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            
            const connection = await pool.getConnection();
            
            // Check if another category with same name/slug exists
            const [existing] = await connection.execute(
                'SELECT id FROM categories WHERE (name = ? OR slug = ?) AND id != ?',
                [name, slug, categoryId]
            );
            
            if (existing.length > 0) {
                req.flash('error', 'Another category with this name already exists.');
                connection.release();
                return res.redirect('/dashboard/categories');
            }
            
            // Update category
            await connection.execute(
                'UPDATE categories SET name = ?, slug = ?, updated_at = NOW() WHERE id = ?',
                [name, slug, categoryId]
            );
            
            connection.release();
            
            req.flash('success', 'Category updated successfully!');
            res.redirect('/dashboard/categories');
        } catch (error) {
            console.error('Update category error:', error);
            req.flash('error', 'Failed to update category. Please try again.');
            res.redirect('/dashboard/categories');
        }
    },

    delete: async (req, res) => {
        try {
            const categoryId = req.params.id;
            
            const connection = await pool.getConnection();
            
            // Check if category has any books or articles
            const [dependencies] = await connection.execute(`
                SELECT 
                    (SELECT COUNT(*) FROM books WHERE categorie_id = ?) as book_count,
                    (SELECT COUNT(*) FROM articles WHERE categorie_id = ?) as article_count
            `, [categoryId, categoryId]);
            
            if (dependencies[0].book_count > 0 || dependencies[0].article_count > 0) {
                req.flash('error', 'Cannot delete category that has books or articles.');
                connection.release();
                return res.redirect('/dashboard/categories');
            }
            
            // Delete category
            await connection.execute('DELETE FROM categories WHERE id = ?', [categoryId]);
            
            connection.release();
            
            req.flash('success', 'Category deleted successfully!');
            res.redirect('/dashboard/categories');
        } catch (error) {
            console.error('Delete category error:', error);
            req.flash('error', 'Failed to delete category. Please try again.');
            res.redirect('/dashboard/categories');
        }
    }
};

module.exports = categoriesController;
