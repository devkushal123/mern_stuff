import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { Chat } from '../models/Chat.js';
import { Message } from '../models/Message.js';

const router = Router();

router.post('/', requireAuth, async (req, res) => {
  const { chatId, content } = req.body;
  const chat = await Chat.findById(chatId);
  if (!chat || !chat.members.map(String).includes(req.user.id))
    return res.status(403).json({ message: 'Not in chat' });

  const msg = await Message.create({ chatId, sender: req.user.id, content });
  await Chat.findByIdAndUpdate(chatId, { updatedAt: new Date() });
  res.json({ message: msg });
});

router.get('/', requireAuth, async (req, res) => {
  const { chatId } = req.query;
  const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
  const cursor = req.query.cursor;

  const chat = await Chat.findById(chatId);
  if (!chat || !chat.members.map(String).includes(req.user.id))
    return res.status(403).json({ message: 'Not in chat' });

  const query = { chatId };
  if (cursor) query.createdAt = { $lt: new Date(cursor) };

  const items = await Message.find(query).sort({ createdAt: -1 }).limit(limit + 1);

  let nextCursor = null;
  if (items.length > limit) {
    const last = items[limit - 1];
    nextCursor = last.createdAt.toISOString();
  }

  res.json({ items: items.slice(0, limit).reverse(), nextCursor });
});

export default router;
