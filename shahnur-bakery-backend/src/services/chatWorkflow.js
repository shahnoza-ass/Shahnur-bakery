const Chat = require('../models/Chat');
const User = require('../models/User');
const mongoose = require('mongoose');
const { isId } = require('./orderWorkflow');
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
async function getSupportChat(userId) {
  const admin = await User.findOne({ role: { $in: ['admin', 'superadmin'] }, isActive: true, status: 'approved', _id: { $ne: userId } }).sort({ createdAt: 1 });
  if (!admin) throw fail('Yordam xizmati hozircha mavjud emas', 503);
  let chat = await Chat.findOne({ participants: { $all: [userId, admin.id] }, isActive: true });
  if (!chat) chat = await Chat.create({ participants: [userId, admin.id] });
  return chat.populate('participants', 'firstName lastName role profileImage');
}
async function sendMessage(chatId, userId, content, io) {
  if (!isId(chatId) || typeof content !== 'string' || !content.trim() || content.length > 2000) throw fail('Xabar 1 dan 2000 tagacha belgi bo‘lishi kerak');
  const chat = await Chat.findOne({ _id: chatId, participants: userId, isActive: true }).select('participants');
  if (!chat) throw fail('Chat topilmadi yoki ruxsat berilmagan', 403);
  const message = { _id: new mongoose.Types.ObjectId(), sender: userId, content: content.trim(), type: 'text', isRead: false, createdAt: new Date() };
  const increments = {};
  for (const participant of chat.participants) if (String(participant) !== userId) increments['unreadCount.' + participant] = 1;
  const update = { $push: { messages: message }, $set: { lastMessage: { content: message.content, sender: userId, timestamp: message.createdAt } } };
  if (Object.keys(increments).length) update.$inc = increments;
  const result = await Chat.updateOne({ _id: chatId, participants: userId, isActive: true, 'messages.9999': { $exists: false } }, update, { runValidators: true });
  if (!result.modifiedCount) throw fail('Chat yopilgan yoki xabarlar limiti tugagan', 409);
  const sender = await User.findById(userId).select('firstName lastName profileImage');
  const payload = { chatId, message: { ...message, sender } };
  if (io) for (const participant of chat.participants) io.to('user_' + participant).emit('new_message', payload);
  return payload;
}
module.exports = { getSupportChat, sendMessage };
