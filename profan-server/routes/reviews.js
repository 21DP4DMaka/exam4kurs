// profan-server/routes/reviews.js
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken } = require('../middleware/auth');

// Iegūt lietotāja atsauksmes (publiski pieejams)
router.get('/users/:userId/reviews', reviewController.getUserReviews);

// Izveidot atsauksmi (nepieciešama autentifikācija)
router.post('/users/:userId/reviews', authenticateToken, reviewController.createReview);

module.exports = router;