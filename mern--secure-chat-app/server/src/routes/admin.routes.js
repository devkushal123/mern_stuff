import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { User } from '../models/User.js';

const router = Router();

router.get('/users', requireAuth, requireRole('admin'), async (req, res) => {
  const users = await User.find().select('name email roles createdAt');
  res.json({ users });
});

router.post('/users/:id/roles', requireAuth, requireRole('admin','moderator'), async (req, res) => {
  const { roles } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { roles }, { new: true });
  res.json({ user });
});

export default router;
