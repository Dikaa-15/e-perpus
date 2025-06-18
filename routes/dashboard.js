const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const usersController = require('../controllers/admin/usersController');
const booksController = require('../controllers/admin/booksController');
const categoriesController = require('../controllers/admin/categoriesController');
const articlesController = require('../controllers/admin/articlesController');
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

module.exports = router;
