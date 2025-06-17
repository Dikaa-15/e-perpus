const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isGuest } = require('../middleware/auth');

// Login routes
router.get('/login', isGuest, authController.showLogin);
router.post('/login', isGuest, authController.login);

// Register routes
router.get('/register', isGuest, authController.showRegister);
router.post('/register', isGuest, authController.register);

// Logout route
router.post('/logout', authController.logout);

module.exports = router;
