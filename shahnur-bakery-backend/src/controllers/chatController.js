const Chat = require('../models/Chat');
const User = require('../models/User');
const workflow = require('../services/chatWorkflow');
const { isId } = require('../services/orderWorkflow');
const handler = fn => async (req, res) => {
  try { await fn(req, res); }
  catch (error) { res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Chat xizmatida xatolik' }); }
};
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
exports.createOrGetChat = handler(async (req, res) => {
  const { userId } = req.body;
  if (!isId(userId) || userId === req.user.id) throw fail('Foydalanuvchi ID noto?g‘ri');
  const user = await User.findById(userId);
  if (!user || !user.isActive || (!['admin', 'superadmin'].includes(user.role) && req.user.role === 'user')) throw fail('Ruxsat berilmagan', 403);
  let chat = await Chat.findOne({ participants: { $all: [req.user.id, userId] }, isActive: true });
  if (!chat) chat = await Chat.create({ participants: [req.user.id, userId] });
  await chat.populate('participants', 'firstName lastName role profileImage');
  res.json({ success: true, data: chat });
});
exports.getUserChats = handler(async (req, res) => {
  const chats = await Chat.find({ participants: req.user.id, isActive: true }).select('-messages').populate('participants', 'firstName lastName role profileImage').sort({ updatedAt: -1 }).limit(100);
  res.json({ success: true, data: chats.map(chat => ({ ...chat.toObject(), unreadCount: chat.unreadCount.get(req.user.id) || 0 })) });
});
exports.getChatById = handler(async (req, res) => {
  if (!isId(req.params.chatId)) throw fail('Chat topilmadi', 404);
  const chat = await Chat.findOne({ _id: req.params.chatId, participants: req.user.id }).select({ messages: { $slice: -100 } }).populate('participants', 'firstName lastName role profileImage').populate('messages.sender', 'firstName lastName role profileImage');
  if (!chat) throw fail('Chat topilmadi', 404);
  res.json({ success: true, data: chat });
});
exports.sendMessage = handler(async (req, res) => {
  const payload = await workflow.sendMessage(req.params.chatId, req.user.id, req.body.content, req.app.get('io'));
  res.status(201).json({ success: true, data: payload.message, chatId: payload.chatId });
});
exports.sendSupportMessage = handler(async (req, res) => {
  const chat = await workflow.getSupportChat(req.user.id);
  if (req.body.content !== undefined) {
    const payload = await workflow.sendMessage(chat.id, req.user.id, req.body.content, req.app.get('io'));
    return res.status(201).json({ success: true, data: payload.message, chatId: chat.id });
  }
  res.json({ success: true, data: chat });
});
exports.markMessagesAsRead = handler(async (req, res) => {
  if (!isId(req.params.chatId)) throw fail('Chat topilmadi', 404);
  const result = await Chat.updateOne({ _id: req.params.chatId, participants: req.user.id }, {
    $set: { ['unreadCount.' + req.user.id]: 0, 'messages.$[message].isRead': true, 'messages.$[message].readAt': new Date() },
  }, { arrayFilters: [{ 'message.sender': { $ne: req.user._id }, 'message.isRead': false }] });
  if (!result.matchedCount) throw fail('Chat topilmadi', 404);
  const chats = await Chat.find({ participants: req.user.id, isActive: true }).select('unreadCount');
  const total = chats.reduce((sum, chat) => sum + (chat.unreadCount.get(req.user.id) || 0), 0);
  req.app.get('io')?.to('user_' + req.user.id).emit('unread_count', total);
  res.json({ success: true });
});
exports.getUnreadCount = handler(async (req, res) => {
  const chats = await Chat.find({ participants: req.user.id, isActive: true }).select('unreadCount');
  const chatUnread = Object.fromEntries(chats.map(chat => [chat.id, chat.unreadCount.get(req.user.id) || 0]));
  res.json({ success: true, data: { totalUnread: Object.values(chatUnread).reduce((a, b) => a + b, 0), chatUnread } });
});
exports.getAllChats = handler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const query = { isActive: true };
  const chats = await Chat.find(query).select('-messages').populate('participants', 'firstName lastName email role profileImage').sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit);
  const total = await Chat.countDocuments(query);
  res.json({ success: true, data: chats.map(chat => ({ ...chat.toObject(), user: chat.participants.find(p => p.role === 'user'), admin: chat.participants.find(p => p.role !== 'user') })), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
exports.assignAdminToChat = handler(async (req, res) => {
  if (!isId(req.params.chatId) || !isId(req.body.adminId)) throw fail('ID noto?g‘ri');
  const admin = await User.findOne({ _id: req.body.adminId, role: { $in: ['admin', 'superadmin'] }, isActive: true });
  if (!admin) throw fail('Admin topilmadi', 404);
  const chat = await Chat.findOneAndUpdate({ _id: req.params.chatId, isActive: true }, { $addToSet: { participants: admin.id } }, { new: true });
  if (!chat) throw fail('Chat topilmadi', 404);
  res.json({ success: true, data: chat });
});
exports.closeChat = handler(async (req, res) => {
  if (!isId(req.params.chatId)) throw fail('ID noto?g‘ri');
  const chat = await Chat.findByIdAndUpdate(req.params.chatId, { isActive: false }, { new: true });
  if (!chat) throw fail('Chat topilmadi', 404);
  res.json({ success: true, data: chat });
});
exports.deleteMessage = handler(async (req, res) => {
  if (!isId(req.params.chatId) || !isId(req.params.messageId)) throw fail('ID noto?g‘ri');
  const chat = await Chat.findOneAndUpdate({ _id: req.params.chatId }, { $pull: { messages: { _id: req.params.messageId } } }, { new: true });
  if (!chat) throw fail('Chat topilmadi', 404);
  const last = chat.messages.at(-1);
  chat.lastMessage = last ? { content: last.content, sender: last.sender, timestamp: last.createdAt } : undefined;
  await chat.save();
  res.json({ success: true });
});
