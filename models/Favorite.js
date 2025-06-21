const { pool } = require('../config/database');

class Favorite {
    /**
     * Delete favorite entries matching the where conditions.
     * @param {Object} options - Options object
     * @param {Object} options.where - Conditions for deletion (e.g. { userId, bookId })
     * @returns {Promise<number>} Number of rows deleted
     */
    static async destroy({ where }) {
        if (!where || Object.keys(where).length === 0) {
            throw new Error('Where conditions are required for destroy operation');
        }

        const connection = await pool.getConnection();
        try {
            // Build WHERE clause and parameters
            const conditions = [];
            const params = [];

            if (where.userId !== undefined) {
                conditions.push('user_id = ?');
                params.push(where.userId);
            }
            if (where.bookId !== undefined) {
                conditions.push('book_id = ?');
                params.push(where.bookId);
            }

            if (conditions.length === 0) {
                throw new Error('No valid where conditions provided');
            }

            const whereClause = conditions.join(' AND ');
            const sql = `DELETE FROM favorits WHERE ${whereClause}`;

            const [result] = await connection.execute(sql, params);
            return result.affectedRows;
        } finally {
            connection.release();
        }
    }

    /**
     * Create a new favorite entry.
     * @param {Object} data - Data object containing userId and bookId
     * @returns {Promise<number>} Inserted row ID
     */
    static async create(data) {
        if (!data || !data.userId || !data.bookId) {
            throw new Error('userId and bookId are required to create a favorite');
        }

        const connection = await pool.getConnection();
        try {
            const sql = 'INSERT INTO favorits (user_id, book_id) VALUES (?, ?)';
            const [result] = await connection.execute(sql, [data.userId, data.bookId]);
            return result.insertId;
        } finally {
            connection.release();
        }
    }
}

module.exports = Favorite;
