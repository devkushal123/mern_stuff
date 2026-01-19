import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { Message } from '../models/Message.js';

const router = Router();

router.get('/messages-per-day', requireAuth, async (req, res) => {
  const data = await Message.aggregate([
    { $match: {} },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  console.log("data messages", data);
  res.json({ series: data.map(d => [new Date(d._id).getTime(), d.count]) });
});

export default router;
