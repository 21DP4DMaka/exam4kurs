// profan-server/routes/tagApplications.js
const express = require('express');
const router = express.Router();
const tagApplicationController = require('../controllers/tagApplicationController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const fileUpload = require('express-fileupload');

// Middleware for file upload
router.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
  abortOnLimit: true,
  safeFileNames: true,
  preserveExtension: true
}));

// Lietotāju maršruti
router.get('/user', authenticateToken, tagApplicationController.getUserApplications);
router.post('/', authenticateToken, tagApplicationController.submitApplication);
router.get('/:id/document', authenticateToken, tagApplicationController.getApplicationDocument);

// Administratoru maršruti
router.get('/', authenticateToken, isAdmin, tagApplicationController.getAllApplications);
router.put('/:id/review', authenticateToken, isAdmin, tagApplicationController.reviewApplication);

module.exports = router;