const express = require('express');
const router = express.Router();
const { askQuestion } = require('../controllers/chatbotController');
const { protect } = require('../middleware/auth');

// Chatbot route - requires authentication
router.post('/ask', protect, askQuestion);

module.exports = router;

