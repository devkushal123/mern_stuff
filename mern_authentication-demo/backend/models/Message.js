const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  message: String,
  isDelivered: { type: Boolean, default: false },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
