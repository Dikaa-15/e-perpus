const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const usersController = require('../controllers/admin/usersController');
const booksController = require('../controllers/admin/booksController');
const categoriesController = require('../controllers/admin/categoriesController');
const articlesController = require('../controllers/admin/articlesController');
const favoritesController = require('../controllers/admin/favoritesController');
const usersApiController = require('../controllers/admin/api/usersController');
const booksApiController = require('../controllers/admin/api/booksController');
const loansController = require('../controllers/admin/loansController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/', isAdmin, dashboardController.index);
// Users routes - Admin only
router.get('/users', isAdmin, usersController.index);
router.post('/users', isAdmin, usersController.create);
router.put('/users/:id', isAdmin, usersController.update);
router.delete('/users/:id', isAdmin, usersController.delete);
// Add POST routes for update and delete as fallback
router.post('/users/:id/update', isAdmin, usersController.update);
router.post('/users/:id/delete', isAdmin, usersController.delete);
// Books routes - Admin only
router.get('/books', isAdmin, booksController.index);
router.post('/books', isAdmin, booksController.uploadMiddleware, booksController.create);
router.put('/books/:id', isAdmin, booksController.uploadMiddleware, booksController.update);
router.delete('/books/:id', isAdmin, booksController.delete);
// Add POST routes for update and delete as fallback
router.post('/books/:id/update', isAdmin, booksController.uploadMiddleware, booksController.update);
router.post('/books/:id/delete', isAdmin, booksController.delete);

// Loans routes - Admin only
router.get('/loans', isAdmin, loansController.index);
router.post('/loans', isAdmin, loansController.create);
router.put('/loans/:id', isAdmin, loansController.update);
router.delete('/loans/:id', isAdmin, loansController.delete);
// Add POST routes for update and delete as fallback
router.post('/loans/:id/update', isAdmin, loansController.update);
router.post('/loans/:id/delete', isAdmin, loansController.delete);

// Categories routes - Admin only
router.get('/categories', isAdmin, categoriesController.index);
router.post('/categories', isAdmin, categoriesController.create);
router.put('/categories/:id', isAdmin, categoriesController.update);
router.delete('/categories/:id', isAdmin, categoriesController.delete);
// Add POST routes for update and delete as fallback
router.post('/categories/:id/update', isAdmin, categoriesController.update);
router.post('/categories/:id/delete', isAdmin, categoriesController.delete);

// Articles routes - Admin only
router.get('/articles', isAdmin, articlesController.index);
router.post('/articles', isAdmin, articlesController.uploadMiddleware, articlesController.create);
router.put('/articles/:id', isAdmin, articlesController.uploadMiddleware, articlesController.update);
router.delete('/articles/:id', isAdmin, articlesController.delete);
// Add POST routes for update and delete as fallback
router.post('/articles/:id/update', isAdmin, articlesController.uploadMiddleware, articlesController.update);
router.post('/articles/:id/delete', isAdmin, articlesController.delete);

// Favorites routes - Admin only
router.get('/favorites', isAdmin, favoritesController.index);
router.get('/favorits', isAdmin, favoritesController.index); // Add route for /favorits (without 's')
router.post('/favorites', isAdmin, favoritesController.create);
router.post('/favorits', isAdmin, favoritesController.create); // Add route for /favorits (without 's')
router.delete('/favorites/:id', isAdmin, favoritesController.delete);
router.delete('/favorits/:id', isAdmin, favoritesController.delete); // Add route for /favorits (without 's')
// Add POST route for delete as fallback
router.post('/favorites/:id/delete', isAdmin, favoritesController.delete);
router.post('/favorits/:id/delete', isAdmin, favoritesController.delete); // Add route for /favorits (without 's')

// API routes for dropdowns - Admin only
router.get('/api/users', isAdmin, usersApiController.index);
router.get('/api/books', isAdmin, booksApiController.index);

module.exports = router;
