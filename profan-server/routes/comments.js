const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');

// This specific route should work with the route prefix
router.get('/', commentController.getCommentsByAnswerId); // This will match /api/answers/:answerId/comments

// The rest of your routes...
router.post('/', commentController.createComment);
router.put('/:id', commentController.updateComment);
router.delete('/:id', commentController.deleteComment);

module.exports = router;