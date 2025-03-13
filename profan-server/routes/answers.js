const express = require('express');
const router = express.Router();
const answerController = require('../controllers/answerController');
const { authenticateToken } = require('../middleware/auth');

// Visiem atbilžu maršrutiem nepieciešama autentifikācija
router.use(authenticateToken);

router.post('/', answerController.createAnswer);
router.patch('/:id/accept', answerController.acceptAnswer);

module.exports = router;