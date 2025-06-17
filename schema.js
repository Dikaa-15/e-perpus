const schema = {
    updateUsersTableColumns: [
        `ALTER TABLE users MODIFY email VARCHAR(100) NOT NULL UNIQUE`,
        `ALTER TABLE users MODIFY password VARCHAR(100) NOT NULL`,
        `ALTER TABLE users MODIFY phone VARCHAR(20)`,
        `ALTER TABLE users ADD COLUMN nik VARCHAR(20) AFTER phone`,
        `ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at`,
        `ALTER TABLE users ADD COLUMN roles ENUM('user','admin') DEFAULT 'user' AFTER updated_at`,
        `ALTER TABLE users ADD COLUMN address TEXT NULL AFTER roles`,
        `ALTER TABLE users ADD COLUMN date_of_birth DATE AFTER address`,
        `ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true AFTER date_of_birth`,
        `ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL AFTER is_active`,
        `ALTER TABLE users ADD COLUMN photo TEXT AFTER last_login_at`,
        `ALTER TABLE users ADD COLUMN gender ENUM('male','female') AFTER photo`
    ],

    updateCategoriesTableColumns: [
        `ALTER TABLE categories ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at`
    ],

    updateBooksTableColumns: [
        `ALTER TABLE books ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at`
    ],

    updateArticlesTableColumns: [
        `ALTER TABLE articles ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at`
    ],

    updateLoansTableColumns: [
        `ALTER TABLE loans ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at`,
        `ALTER TABLE loans MODIFY status ENUM('borrowed','returned','overdue') DEFAULT 'borrowed'`
    ]
};

module.exports = schema;
