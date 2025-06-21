const { pool } = require("../../../config/database");

const booksApiController = {
  index: async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      const [books] = await connection.execute(
        "SELECT id, name, author FROM books WHERE is_available = 1 ORDER BY name"
      );
      res.json(books);
    } catch (error) {
      console.error("Error fetching books:", error);
      res.status(500).json({ error: "Failed to fetch books" });
    } finally {
      if (connection) connection.release();
    }
  },

  filter: async (req, res) => {
    const category = req.query.category || "all";
    const search = req.query.search ? req.query.search.toLowerCase() : "";

    console.log(
      "Filter API called with category:",
      category,
      "search:",
      search
    );

    let connection;
    try {
      connection = await pool.getConnection();

      let query =
        "SELECT b.id, b.name, b.author, b.cover, b.is_popular, b.is_available, b.year_publisher, c.name AS category_name FROM books b LEFT JOIN categories c ON b.categorie_id = c.id WHERE b.is_available = 1";
      const params = [];

      if (category !== "all") {
        query += " AND c.slug = ?";
        params.push(category);
      }

      if (search) {
        query += " AND (LOWER(b.name) LIKE ? OR LOWER(b.author) LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
      }

      query += " ORDER BY b.name";

      console.log("Executing query:", query, "with params:", params);

      const [books] = await connection.execute(query, params);

      res.json({ success: true, books });
    } catch (error) {
      console.error("Error filtering books:", error);
      res.status(500).json({ success: false, error: "Failed to filter books" });
    } finally {
      if (connection) connection.release();
    }
  },
};

module.exports = booksApiController;
