const express = require('express');
const router = express.Router();
const answerController = require('../controllers/answerController');
const { authenticateToken } = require('../middleware/auth');
const profanityFilter = require('../middleware/profanityFilter');

// Visiem atbilžu maršrutiem nepieciešama autentifikācija
router.use(authenticateToken);

// Apply profanity filter to answer creation
router.post('/', profanityFilter, answerController.createAnswer);
router.patch('/:id/accept', answerController.acceptAnswer);

module.exports = router;