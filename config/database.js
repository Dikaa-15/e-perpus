require('dotenv').config();
const mysql = require('mysql2/promise');
const schema = require('../schema');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Function to create database if not exists
async function createDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT
        });

        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        console.log(`Database ${process.env.DB_NAME} created or already exists`);
        await connection.end();
    } catch (error) {
        console.error('Error creating database:', error);
    }
}

// Function to update tables
async function updateTables() {
    const connection = await pool.getConnection();
    try {
        // Update users table
        console.log('Updating users table...');
        for (const query of schema.updateUsersTableColumns) {
            try {
                await connection.execute(query);
            } catch (error) {
                if (!error.message.includes('Duplicate column name')) {
                    console.error('Error executing query:', query);
                    console.error('Error message:', error.message);
                }
            }
        }
        console.log('Users table update completed');

        // Update categories table
        console.log('Updating categories table...');
        for (const query of schema.updateCategoriesTableColumns) {
            try {
                await connection.execute(query);
            } catch (error) {
                if (!error.message.includes('Duplicate column name')) {
                    console.error('Error executing query:', query);
                    console.error('Error message:', error.message);
                }
            }
        }
        console.log('Categories table update completed');

        // Update books table
        console.log('Updating books table...');
        for (const query of schema.updateBooksTableColumns) {
            try {
                await connection.execute(query);
            } catch (error) {
                if (!error.message.includes('Duplicate column name')) {
                    console.error('Error executing query:', query);
                    console.error('Error message:', error.message);
                }
            }
        }
        console.log('Books table update completed');

        // Update articles table
        console.log('Updating articles table...');
        for (const query of schema.updateArticlesTableColumns) {
            try {
                await connection.execute(query);
            } catch (error) {
                if (!error.message.includes('Duplicate column name')) {
                    console.error('Error executing query:', query);
                    console.error('Error message:', error.message);
                }
            }
        }
        console.log('Articles table update completed');

        // Update loans table
        console.log('Updating loans table...');
        for (const query of schema.updateLoansTableColumns) {
            try {
                await connection.execute(query);
            } catch (error) {
                if (!error.message.includes('Duplicate column name')) {
                    console.error('Error executing query:', query);
                    console.error('Error message:', error.message);
                }
            }
        }
        console.log('Loans table update completed');

        console.log('All table updates completed!');
    } finally {
        connection.release();
    }
}

// Initialize database
async function initializeDatabase() {
    await createDatabase();
    await updateTables();
}

module.exports = {
    pool,
    initializeDatabase
};
