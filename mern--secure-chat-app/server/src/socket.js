import { Server } from 'socket.io';
import { verifyAccessToken } from './utils/jwt.js';
import { Notification } from './models/Notification.js';
import { Chat } from './models/Chat.js';

const userSockets = new Map();

function addSocket(userId, socketId) {
  const set = userSockets.get(userId) || new Set();
  set.add(socketId);
  userSockets.set(userId, set);
}
function removeSocket(userId, socketId) {
  const set = userSockets.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) userSockets.delete(userId);
}

export function setupSocket(server, corsOrigin) {
  const io = new Server(server, { cors: { origin: corsOrigin, credentials: true } });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token'));
      const payload = verifyAccessToken(token);
      socket.user = { id: payload.sub, roles: payload.roles };
      next();
    } catch (e) {
      next(new Error('Auth failed'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    addSocket(userId, socket.id);

    const undelivered = await Notification.find({ userId, delivered: false }).sort({ createdAt: 1 });
    for (const n of undelivered) {
      io.to(socket.id).emit('notification', n);
      n.delivered = true; await n.save();
    }

    socket.join(`user:${userId}`);

    socket.on('joinChat', ({ chatId }) => socket.join(`chat:${chatId}`));
    socket.on('leaveChat', ({ chatId }) => socket.leave(`chat:${chatId}`));

    socket.on('sendMessage', async ({ chatId, content }) => {
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.members.map(String).includes(userId)) {
        return socket.emit('error', { message: 'Not in chat' });
      }
      io.to(`chat:${chatId}`).emit('newMessage', {
        chatId, sender: userId, content, createdAt: new Date().toISOString()
      });
      for (const member of chat.members) {
        const mId = member.toString();
        if (mId === userId) continue;
        const room = `user:${mId}`;
        if (io.sockets.adapter.rooms.get(room)?.size) {
          io.to(room).emit('notification', { userId: mId, type: 'message', payload: { chatId, from: userId, content } });
        } else {
          await Notification.create({ userId: mId, type: 'message', payload: { chatId, from: userId, content }, delivered: false });
        }
      }
    });

    socket.on('disconnect', () => removeSocket(userId, socket.id));
  });

  return io;
}
