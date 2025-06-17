const schema = {
    createUsersTable: `
        CREATE TABLE users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `,

    createCategoriesTable: `
        CREATE TABLE categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            slug VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `,

    createBooksTable: `
        CREATE TABLE books (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            slug VARCHAR(50) NOT NULL,
            cover TEXT,
            author VARCHAR(100),
            publisher VARCHAR(100),
            isbn VARCHAR(15),
            is_available BOOLEAN DEFAULT true,
            is_popular BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            year_publisher VARCHAR(20),
            categorie_id INT,
            description TEXT,
            language VARCHAR(50),
            FOREIGN KEY (categorie_id) REFERENCES categories(id)
        )
    `,

    createArticlesTable: `
        CREATE TABLE articles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL,
            cover TEXT,
            content TEXT,
            categorie_id INT,
            is_published BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (categorie_id) REFERENCES categories(id)
        )
    `,

    createFavoritsTable: `
        CREATE TABLE favorits (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            book_id INT,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (book_id) REFERENCES books(id)
        )
    `,

    createLoansTable: `
        CREATE TABLE loans (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            book_id INT,
            loans_date DATE NOT NULL,
            return_date DATE,
            loan_duration DATE,
            due_date DATE NOT NULL,
            status ENUM('borrowed', 'returned', 'overdue') DEFAULT 'borrowed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (book_id) REFERENCES books(id)
        )
    `
};

module.exports = schema;
