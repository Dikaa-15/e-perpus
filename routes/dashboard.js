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
// Other admin routes
router.get('/books', isAdmin, booksController.index);
router.get('/categories', isAdmin, categoriesController.index);
router.get('/articles', isAdmin, articlesController.index);

module.exports = router;
