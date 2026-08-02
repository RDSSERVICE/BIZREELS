const express = require('express');
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * Chat Routes — /api/v1/chat
 */

router.get('/conversations', authenticate, chatController.getConversations);
router.get('/:conversationId/messages', authenticate, chatController.getMessages);
router.post('/messages', authenticate, chatController.sendMessage);
router.delete('/:conversationId/clear', authenticate, chatController.clearChat);
router.delete('/:conversationId', authenticate, chatController.deleteConversation);
router.delete('/messages/:messageId/me', authenticate, chatController.deleteMessageForMe);
router.delete('/messages/:messageId/everyone', authenticate, chatController.deleteMessageForEveryone);

module.exports = router;
