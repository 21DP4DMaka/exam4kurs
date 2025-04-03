// profan-server/routes/statistics.js
const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// All routes require authentication and admin privileges
router.use(authenticateToken);
router.use(isAdmin);

// Get all statistics
router.get('/', statsController.getAdminStats);

// Get specific statistics
router.get('/users', statsController.getUserStats);
router.get('/questions', statsController.getQuestionStats);
router.get('/tags', statsController.getTagStats);

module.exports = router;