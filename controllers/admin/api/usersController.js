const { pool } = require('../../../config/database');

const usersApiController = {
    index: async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();
            const [users] = await connection.execute(
                'SELECT id, name, email FROM users ORDER BY name'
            );
            res.json(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ error: 'Failed to fetch users' });
        } finally {
            if (connection) connection.release();
        }
    }
};

module.exports = usersApiController;
