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

// Function to create tables
async function createTables() {
    try {
        const connection = await pool.getConnection();
        
        // Create tables in order (considering foreign key constraints)
        await connection.execute(schema.createUsersTable);
        console.log('Users table created successfully');
        
        await connection.execute(schema.createCategoriesTable);
        console.log('Categories table created successfully');
        
        await connection.execute(schema.createBooksTable);
        console.log('Books table created successfully');
        
        await connection.execute(schema.createArticlesTable);
        console.log('Articles table created successfully');
        
        await connection.execute(schema.createFavoritsTable);
        console.log('Favorits table created successfully');
        
        await connection.execute(schema.createLoansTable);
        console.log('Loans table created successfully');
        
        connection.release();
        console.log('All tables created successfully!');
    } catch (error) {
        console.error('Error creating tables:', error);
    }
}

// Initialize database
async function initializeDatabase() {
    await createDatabase();
    await createTables();
}

module.exports = {
    pool,
    initializeDatabase
};
