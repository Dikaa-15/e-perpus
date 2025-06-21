const express = require('express');
const router = express.Router();
const booksApiController = require('../../controllers/admin/api/booksController');

router.get('/filter', booksApiController.filter);

module.exports = router;
