require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");
const expressLayouts = require("express-ejs-layouts");
const methodOverride = require("method-override");
const { initializeDatabase } = require("./config/database");

const app = express();

// Initialize database
initializeDatabase()
  .then(() => {
    console.log("Database initialized successfully!");
  })
  .catch((error) => {
    console.error("Database initialization failed:", error);
  });

const isProduction = process.env.NODE_ENV === "production";

console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Session cookie secure flag:", isProduction);

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Debug logging only in development environment
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log("Session ID:", req.sessionID);
    console.log("Session user:", req.session.user);
    console.log("Cookies:", req.headers.cookie);
    next();
  });
}

// Flash messages
app.use(flash());

// Global variables
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// View engine setup
app.use(expressLayouts);
app.set("layout", "layout");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const userDashboardRoutes = require("./routes/userDashboard");

app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/dashboard/user", userDashboardRoutes);

const loansRoutes = require("./routes/loans");
app.use("/loans", loansRoutes);

// Basic route
app.get("/", async (req, res) => {
  const { pool } = require("./config/database");
  let connection;

  try {
    connection = await pool.getConnection();

    // Get total books count
    const [totalBooksResult] = await connection.execute(
      "SELECT COUNT(*) as count FROM books"
    );
    const totalBooks = totalBooksResult[0].count;

    // Get total categories count
    const [totalCategoriesResult] = await connection.execute(
      "SELECT COUNT(*) as count FROM categories"
    );
    const totalCategories = totalCategoriesResult[0].count;

    // Get total users count (members)
    const [totalUsersResult] = await connection.execute(
      'SELECT COUNT(*) as count FROM users WHERE roles = "user"'
    );
    const totalUsers = totalUsersResult[0].count;

    // Get featured books with optional category filter
    console.log("Fetching featured books...");
    const categorySlug = req.query.category;
    let booksQuery = `
        SELECT 
            b.id,
            b.name,
            b.slug,
            b.cover,
            b.author,
            b.publisher,
            b.year_publisher,
            b.is_available,
            b.is_popular,
            b.description,
            c.name as category_name,
            c.slug as category_slug
        FROM books b 
        LEFT JOIN categories c ON b.categorie_id = c.id 
        ${categorySlug && categorySlug !== 'all' ? 'WHERE c.slug = ?' : ''}
        ORDER BY b.is_popular DESC, b.created_at DESC
        LIMIT 8
    `;
    
    let featuredBooksResult;
    if (categorySlug && categorySlug !== 'all') {
      [featuredBooksResult] = await connection.execute(booksQuery, [categorySlug]);
    } else {
      [featuredBooksResult] = await connection.execute(booksQuery);
    }
    const featuredBooks = featuredBooksResult;
    console.log("Featured books found:", featuredBooks.length);
    console.log("Sample book:", featuredBooks[0]);

    // Get all categories for the categories section
    console.log("Fetching categories...");
    const [categoriesResult] = await connection.execute(
      "SELECT * FROM categories ORDER BY name LIMIT 8"
    );
    const categories = categoriesResult;
    console.log("Categories found:", categories.length);

    res.render("index", {
      title: "E-Perpustakaan",
      user: req.session.user || null,
      stats: {
        totalBooks,
        totalCategories,
        totalUsers,
      },
      featuredBooks,
      categories,
    });
  } catch (error) {
    console.error("Error loading homepage data:", error.message);
    console.error("Error stack:", error.stack);
    // Fallback to basic data if database error occurs
    res.render("index", {
      title: "E-Perpustakaan",
      user: req.session.user || null,
      stats: {
        totalBooks: 0,
        totalCategories: 0,
        totalUsers: 0,
      },
      featuredBooks: [],
      categories: [],
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
