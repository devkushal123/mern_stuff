
// src/routes/chats.routes.js
import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth.js';
import { Chat } from '../models/Chat.js';

const router = Router();

router.post('/', requireAuth, async (req, res) => {
  const { isGroup, name, memberIds } = req.body;

  // 1) Build candidate list, include current user
  let members = [req.user.id, ...(Array.isArray(memberIds) ? memberIds : [])];

  // 2) Trim, remove falsy/empty, validate ObjectIds, and uniq
  members = members
    .map(v => (typeof v === 'string' ? v.trim() : v))
    .filter(Boolean)
    .filter(v => mongoose.Types.ObjectId.isValid(v))
    .map(v => new mongoose.Types.ObjectId(v));

  // 3) Uniq
  members = Array.from(new Set(members.map(String))).map(id => new mongoose.Types.ObjectId(id));

  // (Optional) Disallow 1-member chat
  if (!isGroup && members.length !== 2) {
    return res.status(400).json({ message: 'Direct chat must have exactly 2 members' });
  }

  // (Optional) For group chats, require a name
  if (isGroup && !name) {
    return res.status(400).json({ message: 'Group chats require a name' });
  }

  const chat = await Chat.create({ isGroup: !!isGroup, name: name || null, members });
  res.json({ chat });
});

export default router;