require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const { initializeDatabase } = require('./config/database');

const app = express();

// Initialize database
initializeDatabase().then(() => {
    console.log('Database initialized successfully!');
}).catch(error => {
    console.error('Database initialization failed:', error);
});

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

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
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);

// Basic route
const homeController = require('./controllers/homeController');
app.get('/', homeController.welcome);

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
