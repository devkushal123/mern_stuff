import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  content: { type: String, required: true }
}, { timestamps: true });

messageSchema.index({ chatId: 1, createdAt: -1 });

export const Message = mongoose.model('Message', messageSchema);
