
// src/models/Chat.js
import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  name: { type: String },
  isGroup: { type: Boolean, default: false },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }]
}, { timestamps: true });

// Remove falsy/invalid values whenever 'members' is set
chatSchema.path('members').set(function(v) {
  if (!Array.isArray(v)) return [];
  const ids = v
    .map(x => (typeof x === 'string' ? x.trim() : x))
    .filter(Boolean)
    .filter(x => mongoose.Types.ObjectId.isValid(x))
    .map(x => new mongoose.Types.ObjectId(x));
  // uniq
  return Array.from(new Set(ids.map(String))).map(id => new mongoose.Types.ObjectId(id));
});

// Optional: ensure at least 2 members for non-group, or >=2 for group
chatSchema.pre('validate', function(next) {
  if (!this.members || this.members.length < 2) {
    return next(new Error('A chat must have at least two members.'));
  }
  next();
});

export const Chat = mongoose.model('Chat', chatSchema);
