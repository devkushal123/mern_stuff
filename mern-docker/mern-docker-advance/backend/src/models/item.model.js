
import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    completed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

itemSchema.index({ name: 1 }, { unique: false });

export const Item = mongoose.model('Item', itemSchema);
