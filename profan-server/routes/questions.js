const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { authenticateToken } = require('../middleware/auth');

// Publiskais maršruts jautājumu iegūšanai
router.get('/', questionController.getQuestions);
router.get('/:id', questionController.getQuestionById);

// Autentificētie maršruti
router.post('/', authenticateToken, questionController.createQuestion);
router.put('/:id', authenticateToken, questionController.updateQuestion);

module.exports = router;