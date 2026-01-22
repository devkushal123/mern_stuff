
import { Router } from 'express';
import { Item } from '../models/item.model.js';
import { createItemSchema, updateItemSchema } from '../validations/item.schema.js';

const router = Router();

// Create
router.post('/', async (req, res, next) => {
  try {
    const data = createItemSchema.parse(req.body);
    const item = await Item.create(data);
    res.status(201).json(item);
  } catch (err) { next(err); }
});

// Read all (with basic pagination)
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Item.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Item.countDocuments()
    ]);
    res.json({ items, page, limit, total });
  } catch (err) { next(err); }
});

// Read one
router.get('/:id', async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) { next(err); }
});

// Update
router.put('/:id', async (req, res, next) => {
  try {
    const data = updateItemSchema.parse(req.body);
    const item = await Item.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) { next(err); }
});

// Delete
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await Item.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Item not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
