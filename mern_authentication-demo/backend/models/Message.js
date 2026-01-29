
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    message: { type: String, required: true, trim: true },

    isDelivered: { type: Boolean, default: false },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Chat queries fast banane ke liye compound indexes
// MessageSchema.indexes (example)
messageSchema.index({ receiver: 1, isRead: 1 });
messageSchema.index({ sender: 1, isDelivered: 1 });
messageSchema.index({ sender: 1, createdAt: 1 });
messageSchema.index({ receiver: 1, createdAt: 1 });
messageSchema.index({ createdAt: 1 });
messageSchema.index({ sender: 1 });  // for distinct/aggregation on sender



module.exports = mongoose.model("Message", messageSchema);
