const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

class User {
    static async findByEmail(email) {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            return rows[0];
        } finally {
            connection.release();
        }
    }

    static async findById(id) {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT id, username, email FROM users WHERE id = ?',
                [id]
            );
            return rows[0];
        } finally {
            connection.release();
        }
    }

    static async create(userData) {
        const connection = await pool.getConnection();
        try {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const [result] = await connection.execute(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                [userData.username, userData.email, hashedPassword]
            );
            return result.insertId;
        } finally {
            connection.release();
        }
    }

    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
}

module.exports = User;
