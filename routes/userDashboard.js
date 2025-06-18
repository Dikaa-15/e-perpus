const express = require('express');
const router = express.Router();
const userDashboardController = require('../controllers/userDashboardController');
const { isAuthenticated } = require('../middleware/auth');

// User dashboard routes
router.get('/', isAuthenticated, userDashboardController.index);
router.post('/return/:loanId', isAuthenticated, userDashboardController.returnBook);

module.exports = router;
