// profan-server/routes/comments.js
const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');
const profanityFilter = require('../middleware/profanityFilter');

// All comment routes require authentication
router.use(authenticateToken);

// Get comments for an answer
router.get('/answers/:answerId/comments', commentController.getCommentsByAnswerId);

// Create a new comment (applies profanity filter)
router.post('/', profanityFilter, commentController.createComment);

// Update a comment (only creator can update)
router.put('/:id', profanityFilter, commentController.updateComment);

// Delete a comment (only creator or admin can delete)
router.delete('/:id', commentController.deleteComment);

module.exports = router;
