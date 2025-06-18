// SQL Schema as JavaScript module
module.exports = {
    // Table creation queries
    createTables: [
        // Articles table
        `CREATE TABLE IF NOT EXISTS articles (
            id int NOT NULL AUTO_INCREMENT,
            title varchar(255) NOT NULL,
            slug varchar(255) NOT NULL,
            cover text,
            content text,
            categorie_id int DEFAULT NULL,
            is_published tinyint(1) DEFAULT '0',
            created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            CONSTRAINT articles_ibfk_1 FOREIGN KEY (categorie_id) REFERENCES categories (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

        // Books table
        `CREATE TABLE IF NOT EXISTS books (
            id int NOT NULL AUTO_INCREMENT,
            name varchar(50) NOT NULL,
            slug varchar(50) NOT NULL,
            cover text,
            author varchar(100) DEFAULT NULL,
            publisher varchar(100) DEFAULT NULL,
            isbn varchar(15) DEFAULT NULL,
            is_available tinyint(1) DEFAULT '1',
            is_popular tinyint(1) DEFAULT '0',
            created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            year_publisher varchar(20) DEFAULT NULL,
            categorie_id int DEFAULT NULL,
            description text,
            language varchar(50) DEFAULT NULL,
            PRIMARY KEY (id),
            CONSTRAINT books_ibfk_1 FOREIGN KEY (categorie_id) REFERENCES categories (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

        // Categories table
        `CREATE TABLE IF NOT EXISTS categories (
            id int NOT NULL AUTO_INCREMENT,
            name varchar(100) NOT NULL,
            slug varchar(100) NOT NULL,
            created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

        // Favorits table
        `CREATE TABLE IF NOT EXISTS favorits (
            id int NOT NULL AUTO_INCREMENT,
            user_id int DEFAULT NULL,
            book_id int DEFAULT NULL,
            PRIMARY KEY (id),
            CONSTRAINT favorits_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id),
            CONSTRAINT favorits_ibfk_2 FOREIGN KEY (book_id) REFERENCES books (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

        // Loans table
        `CREATE TABLE IF NOT EXISTS loans (
            id int NOT NULL AUTO_INCREMENT,
            user_id int DEFAULT NULL,
            book_id int DEFAULT NULL,
            loans_date date NOT NULL,
            return_date date DEFAULT NULL,
            loan_duration date DEFAULT NULL,
            due_date date NOT NULL,
            status enum('borrowed','returned','overdue') DEFAULT 'borrowed',
            created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            CONSTRAINT loans_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id),
            CONSTRAINT loans_ibfk_2 FOREIGN KEY (book_id) REFERENCES books (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

        // Users table
        `CREATE TABLE IF NOT EXISTS users (
            id int NOT NULL AUTO_INCREMENT,
            name varchar(50) NOT NULL,
            email varchar(100) NOT NULL,
            password varchar(100) NOT NULL,
            phone varchar(20) DEFAULT NULL,
            nik varchar(20) DEFAULT NULL,
            created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            roles enum('user','admin') DEFAULT 'user',
            address text,
            date_of_birth date DEFAULT NULL,
            is_active tinyint(1) DEFAULT '1',
            last_login_at timestamp NULL DEFAULT NULL,
            photo text,
            gender enum('male','female') DEFAULT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`
    ],

    // Update queries for each table (MySQL doesn't support IF NOT EXISTS in ALTER TABLE ADD COLUMN)
    updateUsersTableColumns: [
        "ALTER TABLE users ADD COLUMN roles enum('user','admin') DEFAULT 'user'",
        "ALTER TABLE users ADD COLUMN is_active tinyint(1) DEFAULT '1'",
        "ALTER TABLE users ADD COLUMN last_login_at timestamp NULL DEFAULT NULL",
        "ALTER TABLE users ADD COLUMN address text",
        "ALTER TABLE users ADD COLUMN date_of_birth date DEFAULT NULL",
        "ALTER TABLE users ADD COLUMN photo text",
        "ALTER TABLE users ADD COLUMN gender enum('male','female') DEFAULT NULL"
    ],

    updateCategoriesTableColumns: [
        "ALTER TABLE categories ADD COLUMN created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP",
        "ALTER TABLE categories ADD COLUMN updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    ],

    updateBooksTableColumns: [
        "ALTER TABLE books ADD COLUMN is_popular tinyint(1) DEFAULT '0'",
        "ALTER TABLE books ADD COLUMN year_publisher varchar(20) DEFAULT NULL",
        "ALTER TABLE books ADD COLUMN description text",
        "ALTER TABLE books ADD COLUMN language varchar(50) DEFAULT NULL"
    ],

    updateArticlesTableColumns: [
        "ALTER TABLE articles ADD COLUMN is_published tinyint(1) DEFAULT '0'"
    ],

    updateLoansTableColumns: [
        "ALTER TABLE loans ADD COLUMN status enum('borrowed','returned','overdue') DEFAULT 'borrowed'",
        "ALTER TABLE loans ADD COLUMN loan_duration date DEFAULT NULL"
    ]
};
