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
                'SELECT id, name, email, roles, phone, nik, address, date_of_birth, gender, is_active FROM users WHERE id = ?',
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
                `INSERT INTO users (
                    name, 
                    email, 
                    password, 
                    phone, 
                    nik, 
                    address, 
                    date_of_birth, 
                    gender,
                    roles,
                    is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'user', true)`,
                [
                    userData.name,
                    userData.email,
                    hashedPassword,
                    userData.phone || null,
                    userData.nik || null,
                    userData.address || null,
                    userData.date_of_birth || null,
                    userData.gender || null
                ]
            );
            return result.insertId;
        } finally {
            connection.release();
        }
    }

    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    static async updateLastLogin(userId) {
        const connection = await pool.getConnection();
        try {
            await connection.execute(
                'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
                [userId]
            );
        } finally {
            connection.release();
        }
    }
}

module.exports = User;
