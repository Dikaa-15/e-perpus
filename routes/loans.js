const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const loansController = require('../controllers/loansController');

router.post('/', isAuthenticated, loansController.createLoan);

module.exports = router;
