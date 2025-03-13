const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Publiskās autentifikācijas maršruti
router.post('/register', authController.register);
router.post('/login', authController.login);

// Autentificētais maršruts
router.get('/me', authenticateToken, authController.getCurrentUser);

module.exports = router;