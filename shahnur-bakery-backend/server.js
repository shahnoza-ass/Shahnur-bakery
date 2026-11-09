require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const app = require('./src/app');
const connectDB = require('./src/config/database');
const User = require('./src/models/User');
const Chat = require('./src/models/Chat');
const chatWorkflow = require('./src/services/chatWorkflow');
const { isId } = require('./src/services/orderWorkflow');
function configureSockets(server) {
  const io = new Server(server, { cors: { origin: (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map(s => s.trim()), credentials: true }, maxHttpBufferSize: 16384 });
  const authenticate = async token => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || (decoded.version || 0) !== (user.tokenVersion || 0) || !user.isActive || user.status !== 'approved' || user.passwordChangedAt && decoded.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) throw new Error('Ruxsat berilmagan');
    return { user, decoded };
  };
  io.use(async (socket, next) => {
    try { socket.authenticated = await authenticate(socket.handshake.auth?.token); next(); }
    catch { next(new Error('Authentication error')); }
  });
  io.on('connection', socket => {
    const user = socket.authenticated.user;
    socket.join('user_' + user.id);
    if (['admin', 'superadmin'].includes(user.role)) socket.join('admins');
    let count = 0, windowStart = Date.now();
    socket.use(async (_packet, next) => {
      try {
        if (Date.now() - windowStart > 60000) { count = 0; windowStart = Date.now(); }
        if (++count > 120) throw new Error('Juda ko?p so?rov');
        await authenticate(socket.handshake.auth.token);
        next();
      } catch { socket.disconnect(true); }
    });
    socket.on('join_chat', async (chatId, ack = () => {}) => {
      try {
        if (!isId(chatId) || !await Chat.exists({ _id: chatId, participants: user.id, isActive: true })) throw new Error();
        socket.join('chat_' + chatId); if (typeof ack === 'function') ack({ success: true });
      } catch { if (typeof ack === 'function') ack({ success: false, message: 'Ruxsat berilmagan' }); }
    });
    socket.on('leave_chat', chatId => { if (isId(chatId)) socket.leave('chat_' + chatId); });
    socket.on('send_message', async (data, ack = () => {}) => {
      try {
        const result = await chatWorkflow.sendMessage(data?.chatId, user.id, data?.content, io);
        if (typeof ack === 'function') ack({ success: true, data: result });
      } catch (error) { if (typeof ack === 'function') ack({ success: false, message: error.status ? error.message : 'Xabar yuborilmadi' }); }
    });
    socket.on('typing', async data => {
      try {
        if (isId(data?.chatId) && await Chat.exists({ _id: data.chatId, participants: user.id, isActive: true })) socket.to('chat_' + data.chatId).emit('user_typing', { userId: user.id, isTyping: !!data.isTyping });
      } catch { /* Ignore invalid typing events. */ }
    });
  });
  return io;
}
async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET kamida 32 belgidan iborat bo?lishi kerak');
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI sozlanmagan');
  await connectDB();
  const server = http.createServer(app);
  const io = configureSockets(server);
  app.set('io', io);
  server.listen(process.env.PORT || 5000, () => console.log('Bakery server ready'));
  const shutdown = () => { io.close(); server.close(() => process.exit(0)); };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  return { server, io };
}
if (require.main === module) start().catch(error => { console.error('Server startup failed:', error.message); process.exitCode = 1; });
module.exports = { start, configureSockets };
