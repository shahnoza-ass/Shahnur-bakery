const express = require('express');
const router = express.Router();
const {
  createOrGetChat,
  getUserChats,
  getChatById,
  sendMessage,
  sendSupportMessage,
  markMessagesAsRead,
  getUnreadCount,
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

// User routes
router.post('/', protect, createOrGetChat);
router.get('/', protect, getUserChats);
router.get('/unread', protect, getUnreadCount);
router.get('/:chatId', protect, getChatById);
router.post('/:chatId/messages', protect, sendMessage);
router.put('/:chatId/read', protect, markMessagesAsRead);
router.post('/support', protect, sendSupportMessage);

module.exports = router;