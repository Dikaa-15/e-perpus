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
                LEFT JOIN categories c ON b.category_id = c.id
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
};

module.exports = homeController;
