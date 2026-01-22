
import { z } from 'zod';

export const createItemSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  completed: z.boolean().optional()
});

export const updateItemSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(1000).optional(),
  completed: z.boolean().optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});
``
