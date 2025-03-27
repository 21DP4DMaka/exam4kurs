
const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');

// All routes should use authentication
router.use(authenticateToken);

// GET comments for an answer - with the correct endpoint format
router.get('/:answerId/comments', commentController.getCommentsByAnswerId)  

// POST create a new comment
router.post('/', commentController.createComment);

// PUT update a comment
router.put('/:id', commentController.updateComment);

// DELETE delete a comment
router.delete('/:id', commentController.deleteComment);

module.exports = router;