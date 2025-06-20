const { pool } = require('../../config/database');

const favoritesController = {
    index: async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();
            
            // Get query parameters
            const search = req.query.search || '';
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const offset = (page - 1) * limit;
            
            // Build WHERE conditions
            let whereConditions = [];
            let queryParams = [];
            
            if (search) {
                whereConditions.push('(users.name LIKE ? OR books.name LIKE ?)');
                const searchTerm = `%${search}%`;
                queryParams.push(searchTerm, searchTerm);
            }
            
            const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
            
            // Get total count for pagination
            const [countResult] = await connection.execute(`
                SELECT COUNT(*) as count 
                FROM favorits 
                JOIN users ON favorits.user_id = users.id 
                JOIN books ON favorits.book_id = books.id 
                ${whereClause}
            `, queryParams);
            
            const totalCount = countResult[0].count;
            const totalPages = Math.ceil(totalCount / limit);
            
            // Prepare parameters for the main query (search params only)
            const mainQueryParams = [...queryParams];
            
            // Get favorites with user and book details
            const [favorites] = await connection.execute(`
                SELECT 
                    favorits.id,
                    favorits.user_id,
                    favorits.book_id,
                    users.name as user_name,
                    users.email as user_email,
                    books.name as book_name,
                    books.author as book_author,
                    books.cover as book_cover
                FROM favorits
                JOIN users ON favorits.user_id = users.id
                JOIN books ON favorits.book_id = books.id
                ${whereClause}
                ORDER BY favorits.id DESC
                LIMIT ${limit} OFFSET ${offset}
            `, mainQueryParams);

            // Get users for create modal
            const [users] = await connection.execute('SELECT id, name, email FROM users WHERE is_active = 1 ORDER BY name ASC');

            // Get books for create modal
            const [books] = await connection.execute('SELECT id, name, author FROM books WHERE is_available = 1 ORDER BY name ASC');
            
            res.render('admin/favorites/index', {
                title: 'Favorites Management',
                user: req.session.user,
                path: req.path,
                layout: 'layouts/admin',
                favorites,
                users,
                books,
                currentPage: page,
                totalPages,
                search,
                messages: {
                    success: req.flash('success'),
                    error: req.flash('error')
                }
            });
            
        } catch (error) {
            console.error('Favorites index error:', error);
            req.flash('error', 'Failed to load favorites data');
            res.redirect('/dashboard');
        } finally {
            if (connection) connection.release();
        }
    },

    create: async (req, res) => {
        let connection;
        try {
            const { user_id, book_id } = req.body;
            
            if (!user_id || !book_id) {
                throw new Error('User ID and Book ID are required');
            }
            
            connection = await pool.getConnection();
            
            // Check if favorite already exists
            const [existing] = await connection.execute(
                'SELECT id FROM favorits WHERE user_id = ? AND book_id = ?',
                [user_id, book_id]
            );
            
            if (existing.length > 0) {
                req.flash('error', 'This book is already in favorites');
                return res.redirect('/dashboard/favorites');
            }
            
            // Create new favorite
            await connection.execute(
                'INSERT INTO favorits (user_id, book_id) VALUES (?, ?)',
                [user_id, book_id]
            );
            
            req.flash('success', 'Favorite added successfully');
            res.redirect('/dashboard/favorites');
            
        } catch (error) {
            console.error('Create favorite error:', error);
            req.flash('error', `Failed to add favorite: ${error.message}`);
            res.redirect('/dashboard/favorites');
        } finally {
            if (connection) connection.release();
        }
    },

    delete: async (req, res) => {
        let connection;
        try {
            const favoriteId = req.params.id;
            
            connection = await pool.getConnection();
            await connection.execute('DELETE FROM favorits WHERE id = ?', [favoriteId]);
            
            req.flash('success', 'Favorite removed successfully');
            res.redirect('/dashboard/favorites');
            
        } catch (error) {
            console.error('Delete favorite error:', error);
            req.flash('error', 'Failed to remove favorite');
            res.redirect('/dashboard/favorites');
        } finally {
            if (connection) connection.release();
        }
    }
};

module.exports = favoritesController;
