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
  res.locals.successReturn = req.flash('successReturn');
  res.locals.lateReturn = req.flash('lateReturn');
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

const articlesRoutes = require("./routes/articles");
app.use("/articles", articlesRoutes);

// API routes for books
const booksApiRoutes = require('./routes/api/books');
app.use('/api/books', booksApiRoutes);
const userRoutes = require('./routes/user');

app.use('/user', userRoutes);

// Basic route
const homeController = require('./controllers/homeController');

// Comment out or remove homeController welcome route
// app.get('/', homeController.welcome);

// Use userRoutes at root path
app.use('/', userRoutes);

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
