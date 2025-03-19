const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken } = require('../middleware/auth');

// Get reviews for a user (public)
router.get('/users/:userId/reviews', reviewController.getUserReviews);

// Create a review (requires authentication)
router.post('/users/:userId/reviews', authenticateToken, reviewController.createReview);

module.exports = router;