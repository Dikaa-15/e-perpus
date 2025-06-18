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
    const connection = await pool.getConnection();
    try {
        console.log('Creating tables...');
        
        // Create tables in correct order (users and categories first, then others)
        const orderedTables = [
            schema.createTables[5], // users table
            schema.createTables[2], // categories table
            schema.createTables[1], // books table
            schema.createTables[0], // articles table
            schema.createTables[3], // favorits table
            schema.createTables[4]  // loans table
        ];
        
        for (const query of orderedTables) {
            try {
                await connection.execute(query);
            } catch (error) {
                console.error('Error creating table:', error.message);
            }
        }
        console.log('Tables creation completed');
    } finally {
        connection.release();
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
                if (!error.message.includes('Duplicate column name') && !error.message.includes('already exists')) {
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
                if (!error.message.includes('Duplicate column name') && !error.message.includes('already exists')) {
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
                if (!error.message.includes('Duplicate column name') && !error.message.includes('already exists')) {
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
                if (!error.message.includes('Duplicate column name') && !error.message.includes('already exists')) {
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
                if (!error.message.includes('Duplicate column name') && !error.message.includes('already exists')) {
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

// Function to seed initial data
async function seedInitialData() {
    const connection = await pool.getConnection();
    try {
        // Check if categories exist
        const [categories] = await connection.execute('SELECT COUNT(*) as count FROM categories');
        
        if (categories[0].count === 0) {
            console.log('Seeding initial categories...');
            const initialCategories = [
                ['Fiction', 'fiction'],
                ['Non-Fiction', 'non-fiction'],
                ['Science', 'science'],
                ['Technology', 'technology'],
                ['History', 'history'],
                ['Biography', 'biography']
            ];
            
            for (const [name, slug] of initialCategories) {
                await connection.execute(
                    'INSERT INTO categories (name, slug, created_at) VALUES (?, ?, NOW())',
                    [name, slug]
                );
            }
            console.log('Initial categories seeded successfully');
        }
        
        // Check if admin user exists
        const [users] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE roles = "admin"');
        
        if (users[0].count === 0) {
            console.log('Creating default admin user...');
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            await connection.execute(
                'INSERT INTO users (name, email, password, roles, is_active, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
                ['Administrator', 'admin@example.com', hashedPassword, 'admin', 1]
            );
            console.log('Default admin user created (email: admin@example.com, password: admin123)');
        }
        
    } catch (error) {
        console.error('Error seeding initial data:', error);
    } finally {
        connection.release();
    }
}

// Initialize database
async function initializeDatabase() {
    try {
        await createDatabase();
        await createTables();
        await updateTables();
        await seedInitialData();
        console.log('Database initialization completed successfully!');
    } catch (error) {
        console.error('Database initialization failed:', error);
    }
}

module.exports = {
    pool,
    initializeDatabase
};
