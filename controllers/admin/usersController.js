const { pool } = require('../../config/database');
const bcrypt = require('bcrypt');

const usersController = {
    // List all users with pagination, search, and filter
    index: async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();
            
            // Get search and filter parameters
            const search = req.query.search || '';
            const status = req.query.status || '';
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const offset = (page - 1) * limit;
            
            // Build WHERE clause for search and filter
            let whereClause = 'WHERE 1=1';
            let queryParams = [];
            
            // Add search functionality
            if (search) {
                whereClause += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR nik LIKE ?)';
                const searchTerm = `%${search}%`;
                queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }
            
            // Add status filter
            if (status !== '') {
                whereClause += ' AND is_active = ?';
                queryParams.push(status === 'active' ? 1 : 0);
            }
            
            // Get users with search and filter
            const usersQuery = `
                SELECT id, name, email, phone, nik, roles, 
                       COALESCE(is_active, 1) as is_active, 
                       created_at, photo, gender, address, date_of_birth 
                FROM users 
                ${whereClause}
                ORDER BY created_at DESC 
                LIMIT ${limit} OFFSET ${offset}
            `;
            
            const [users] = await connection.execute(usersQuery, queryParams);
            
            console.log('Users found:', users.length, 'users'); // Debug log
            
            // Get total count with same filters
            const countQuery = `SELECT COUNT(*) as count FROM users ${whereClause}`;
            const [totalCount] = await connection.execute(countQuery, queryParams);
            const totalPages = Math.ceil(totalCount[0].count / limit);
            
            res.render('admin/users/index', {
                title: 'Users Management',
                user: req.session.user,
                path: req.path,
                layout: 'layouts/admin',
                users: users,
                currentPage: page,
                totalPages: totalPages,
                search: search,
                status: status,
                messages: {
                    success: req.flash('success'),
                    error: req.flash('error')
                }
            });
        } catch (error) {
            console.error('Users index error:', error);
            req.flash('error', 'Failed to fetch users: ' + error.message);
            res.render('admin/users/index', {
                title: 'Users Management',
                user: req.session.user,
                path: req.path,
                layout: 'layouts/admin',
                users: [],
                currentPage: 1,
                totalPages: 1,
                search: '',
                status: '',
                messages: {
                    success: req.flash('success'),
                    error: req.flash('error')
                }
            });
        } finally {
            if (connection) connection.release();
        }
    },

    // Create new user
    create: async (req, res) => {
        try {
            const connection = await pool.getConnection();
            const { 
                name, email, password, phone, nik, roles,
                address, date_of_birth, gender, is_active 
            } = req.body;

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert new user
            await connection.execute(`
                INSERT INTO users (
                    name, email, password, phone, nik, roles,
                    address, date_of_birth, gender, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                name, email, hashedPassword, phone, nik, roles,
                address, date_of_birth, gender, is_active === 'on'
            ]);

            connection.release();
            req.flash('success', 'User created successfully');
            res.redirect('/dashboard/users');
        } catch (error) {
            console.error('Create user error:', error);
            req.flash('error', 'Failed to create user');
            res.redirect('/dashboard/users');
        }
    },

    // Update user
    update: async (req, res) => {
        try {
            const connection = await pool.getConnection();
            const { id } = req.params;
            const { 
                name, email, phone, nik, roles,
                address, date_of_birth, gender, is_active 
            } = req.body;

            // Update user
            await connection.execute(`
                UPDATE users 
                SET name = ?, email = ?, phone = ?, nik = ?, roles = ?,
                    address = ?, date_of_birth = ?, gender = ?, is_active = ?
                WHERE id = ?
            `, [
                name, email, phone, nik, roles,
                address, date_of_birth, gender, is_active === 'on',
                id
            ]);

            connection.release();
            req.flash('success', 'User updated successfully');
            res.redirect('/dashboard/users');
        } catch (error) {
            console.error('Update user error:', error);
            req.flash('error', 'Failed to update user');
            res.redirect('/dashboard/users');
        }
    },

    // Delete user
    delete: async (req, res) => {
        try {
            const connection = await pool.getConnection();
            const { id } = req.params;

            // Delete user
            await connection.execute('DELETE FROM users WHERE id = ?', [id]);

            connection.release();
            req.flash('success', 'User deleted successfully');
            res.redirect('/dashboard/users');
        } catch (error) {
            console.error('Delete user error:', error);
            req.flash('error', 'Failed to delete user');
            res.redirect('/dashboard/users');
        }
    }
};

module.exports = usersController;
