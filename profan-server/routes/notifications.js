const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

// Visiem paziņojumu maršrutiem nepieciešama autentifikācija
router.use(authenticateToken);

router.get('/', notificationController.getUserNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/mark-all-read', notificationController.markAllAsRead);

module.exports = router;