// profan-server/routes/questions.js
const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const profanityFilter = require('../middleware/profanityFilter');

// Publiskais maršruts jautājumu iegūšanai
router.get('/', questionController.getQuestions);
router.get('/:id', questionController.getQuestionById);

// Autentificētie maršruti
router.post('/', authenticateToken, profanityFilter, questionController.createQuestion);
router.put('/:id', authenticateToken, profanityFilter, questionController.updateQuestion);

// Admin routes
router.delete('/:id', authenticateToken, isAdmin, questionController.deleteQuestion);

// Report question route
router.post('/:id/report', authenticateToken, questionController.reportQuestion);

module.exports = router;