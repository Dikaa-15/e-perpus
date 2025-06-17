const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const loansController = require('../controllers/loansController');

// Create a new loan
router.post('/', isAuthenticated, loansController.createLoan);

// Get loan details by ID
router.get('/:id', isAuthenticated, loansController.getLoan);

module.exports = router;
