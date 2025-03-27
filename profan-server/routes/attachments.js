// profan-server/routes/attachments.js
const express = require('express');
const router = express.Router();
const attachmentController = require('../controllers/attachmentController');
const { authenticateToken } = require('../middleware/auth');
const fileUpload = require('express-fileupload');

// Middleware for file upload
router.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  abortOnLimit: true,
  safeFileNames: true,
  preserveExtension: true
}));

// All attachment routes require authentication
router.use(authenticateToken);

// Upload attachments for a question
router.post('/questions/:questionId/attachments', attachmentController.uploadAttachments);

// Get attachments for a question
router.get('/questions/:questionId/attachments', attachmentController.getAttachmentsByQuestionId);

// Get a specific attachment
router.get('/attachments/:id', attachmentController.getAttachment);

// Download an attachment
router.get('/attachments/:id/download', attachmentController.downloadAttachment);

// Delete an attachment
router.delete('/attachments/:id', attachmentController.deleteAttachment);

module.exports = router;