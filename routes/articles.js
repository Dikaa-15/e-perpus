const express = require('express');
const router = express.Router();
const articlesController = require('../controllers/articlesController');

// Show article by id
router.get('/:id', articlesController.show);

module.exports = router;
