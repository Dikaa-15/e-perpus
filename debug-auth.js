require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('./config/database');

async function debugAuthentication() {
    console.log('=== Authentication Debug Tool ===\n');
    
    try {
        // Check database connection
        console.log('1. Testing database connection...');
        const connection = await pool.getConnection();
        console.log('✓ Database connection successful\n');
        
        // Check if users table exists
        console.log('2. Checking users table...');
        const [tables] = await connection.execute("SHOW TABLES LIKE 'users'");
        if (tables.length === 0) {
            console.log('✗ Users table does not exist!');
            console.log('Run: node init-database.js to create tables\n');
            return;
        }
        console.log('✓ Users table exists\n');
        
        // Check users in database
        console.log('3. Checking existing users...');
        const [users] = await connection.execute('SELECT id, name, email, roles, is_active FROM users');
        
        if (users.length === 0) {
            console.log('✗ No users found in database!');
            console.log('Creating default admin user...');
            
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await connection.execute(
                'INSERT INTO users (name, email, password, roles, is_active, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
                ['Administrator', 'admin@example.com', hashedPassword, 'admin', 1]
            );
            console.log('✓ Default admin user created');
            console.log('Email: admin@example.com');
            console.log('Password: admin123\n');
        } else {
            console.log(`✓ Found ${users.length} users:`);
            users.forEach(user => {
                console.log(`  - ${user.name} (${user.email}) - Role: ${user.roles} - Active: ${user.is_active ? 'Yes' : 'No'}`);
            });
            console.log('');
        }
        
        // Test password verification for admin user
        console.log('4. Testing password verification...');
        const [adminUsers] = await connection.execute('SELECT * FROM users WHERE email = ?', ['admin@example.com']);
        
        if (adminUsers.length > 0) {
            const admin = adminUsers[0];
            const testPassword = 'admin123';
            const isValid = await bcrypt.compare(testPassword, admin.password);
            
            if (isValid) {
                console.log('✓ Password verification working correctly');
                console.log(`✓ Admin login should work with: admin@example.com / ${testPassword}\n`);
            } else {
                console.log('✗ Password verification failed!');
                console.log('Updating admin password...');
                
                const newHashedPassword = await bcrypt.hash(testPassword, 10);
                await connection.execute(
                    'UPDATE users SET password = ? WHERE email = ?',
                    [newHashedPassword, 'admin@example.com']
                );
                console.log('✓ Admin password updated\n');
            }
        }
        
        // Check environment variables
        console.log('5. Checking environment variables...');
        const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'SESSION_SECRET'];
        let envIssues = false;
        
        requiredEnvVars.forEach(envVar => {
            if (!process.env[envVar]) {
                console.log(`✗ Missing environment variable: ${envVar}`);
                envIssues = true;
            } else {
                console.log(`✓ ${envVar} is set`);
            }
        });
        
        if (envIssues) {
            console.log('\nPlease create a .env file with the required variables.');
        }
        
        connection.release();
        console.log('\n=== Debug Complete ===');
        console.log('Try logging in with: admin@example.com / admin123');
        
    } catch (error) {
        console.error('Debug failed:', error);
    }
    
    process.exit(0);
}

debugAuthentication();
