const express = require('express');
const router = express.Router();
const userDashboardController = require('../controllers/userDashboardController');
const homeController = require('../controllers/homeController');
const { isAuthenticated } = require('../middleware/auth');

// User dashboard routes
router.get('/', isAuthenticated, userDashboardController.index);
router.post('/return/:loanId', isAuthenticated, userDashboardController.returnBook);
router.post('/favorite/toggle', isAuthenticated, userDashboardController.toggleFavorite);

// Add route to delete favorite book by ID
router.delete('/favorites/delete/:id', isAuthenticated, userDashboardController.deleteFavoriteBook);

// New route for fetching books filtered by category
router.get('/api/books/filter', isAuthenticated, homeController.getBooksByCategory);

// New route for fetching articles filtered by category and search
router.get('/api/articles/filter', isAuthenticated, homeController.getArticlesByCategory);

module.exports = router;
