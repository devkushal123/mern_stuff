import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { User } from '../models/User.js';

const router = Router();

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).select('name email roles');
  res.json({ user });
});

export default router;
