const { pool } = require('./config/database');

async function testDatabase() {
    let connection;
    try {
        console.log('Testing database connection...');
        connection = await pool.getConnection();
        
        // Test basic connectivity
        await connection.execute('SELECT 1');
        console.log('✓ Database connection successful');
        
        // Check if books table exists
        const [tables] = await connection.execute('SHOW TABLES LIKE "books"');
        console.log('Books table exists:', tables.length > 0);
        
        if (tables.length > 0) {
            // Check books table structure
            const [columns] = await connection.execute('DESCRIBE books');
            console.log('Books table columns:', columns.map(col => col.Field));
            
            // Count books
            const [count] = await connection.execute('SELECT COUNT(*) as count FROM books');
            console.log('Total books in database:', count[0].count);
            
            // Get sample books
            const [books] = await connection.execute('SELECT * FROM books LIMIT 3');
            console.log('Sample books:', JSON.stringify(books, null, 2));
            
            // Check categories
            const [categories] = await connection.execute('SELECT * FROM categories');
            console.log('Categories:', JSON.stringify(categories, null, 2));
        }
        
    } catch (error) {
        console.error('Database test error:', error);
    } finally {
        if (connection) {
            connection.release();
        }
        process.exit(0);
    }
}

testDatabase();
