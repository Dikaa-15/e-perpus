const { pool } = require("../config/database");

const homeController = {
  welcome: async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();

      // Fetch popular books (limit 5)
      const [popularBooks] = await connection.execute(`
                SELECT id, name, author, cover 
                FROM books 
                WHERE is_popular = 1 AND is_available = 1 
                ORDER BY created_at DESC 
                LIMIT 5
            `);

      // Fetch latest articles (limit 5)
      const [latestArticles] = await connection.execute(`
                SELECT id, title, cover, SUBSTRING(content, 1, 150) AS excerpt 
                FROM articles 
                WHERE is_published = 1 
                ORDER BY created_at DESC 
                LIMIT 5
            `);

      // Fetch stats: totalBooks and totalCategories
      const [[stats]] = await connection.execute(`
                SELECT 
                    (SELECT COUNT(*) FROM books) AS totalBooks,
                    (SELECT COUNT(*) FROM categories) AS totalCategories
            `);

      // Fetch categories
      const [categories] = await connection.execute(`
                SELECT id, name, slug FROM categories ORDER BY name
            `);

      // Fetch featured books (limit 8) with category name join
      const [featuredBooks] = await connection.execute(`
                SELECT b.id, b.name, b.author, b.cover, c.name AS category_name, b.is_popular, b.is_available
                FROM books b
                LEFT JOIN categories c ON b.categorie_id = c.id
                ORDER BY b.created_at DESC
                LIMIT 8
            `);

      res.render("index", {
        title: "E-Perpustakaan",
        user: req.session.user || null,
        popularBooks,
        latestArticles,
        stats,
        categories,
        featuredBooks,
      });
    } catch (error) {
      console.error("Error fetching welcome page data:", error);
      res.render("index", {
        title: "E-Perpustakaan",
        user: req.session.user || null,
        popularBooks: [],
        latestArticles: [],
        stats: { totalBooks: 0, totalCategories: 0 },
        categories: [],
        featuredBooks: [],
      });
    } finally {
      if (connection) connection.release();
    }
  },

  getBooksByCategory: async (req, res) => {
    let connection;
    try {
      const categorySlug = req.query.category || 'all';
      const searchTerm = req.query.search ? req.query.search.toLowerCase().trim() : '';
      connection = await pool.getConnection();

      let query = `
        SELECT b.id, b.name, b.author, b.cover, c.name AS category_name, b.is_popular, b.is_available
        FROM books b
        LEFT JOIN categories c ON b.categorie_id = c.id
      `;

      let params = [];

      if (categorySlug !== 'all') {
        query += ' WHERE c.slug = ?';
        params.push(categorySlug);
      }

      if (searchTerm) {
        if (categorySlug !== 'all') {
          query += ' AND (LOWER(b.name) LIKE ? OR LOWER(b.author) LIKE ?)';
        } else {
          query += ' WHERE (LOWER(b.name) LIKE ? OR LOWER(b.author) LIKE ?)';
        }
        params.push('%' + searchTerm + '%', '%' + searchTerm + '%');
      }

      query += ' ORDER BY b.created_at DESC';

      const [books] = await connection.execute(query, params);

      res.json({ success: true, books });
    } catch (error) {
      console.error('Error fetching books by category:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch books' });
    } finally {
      if (connection) connection.release();
    }
  },

  getArticlesByCategory: async (req, res) => {
    let connection;
    try {
      const categorySlug = req.query.category || 'all';
      const searchTerm = req.query.search ? req.query.search.toLowerCase().trim() : '';
      connection = await pool.getConnection();

      let query = `
        SELECT a.id, a.title, a.cover, SUBSTRING(a.content, 1, 150) AS excerpt, c.name AS category_name
        FROM articles a
        LEFT JOIN categories c ON a.categorie_id = c.id
        WHERE a.is_published = 1
      `;

      let params = [];

      if (categorySlug !== 'all') {
        query += ' AND c.slug = ?';
        params.push(categorySlug);
      }

      if (searchTerm) {
        query += ' AND (LOWER(a.title) LIKE ?)';
        params.push('%' + searchTerm + '%');
      }

      query += ' ORDER BY a.created_at DESC';

      const [articles] = await connection.execute(query, params);

      res.json({ success: true, articles });
    } catch (error) {
      console.error('Error fetching articles by category:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch articles' });
    } finally {
      if (connection) connection.release();
    }
  }
};

module.exports = homeController;
