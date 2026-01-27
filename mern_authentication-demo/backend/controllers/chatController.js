const Message = require("@models/Message");

exports.getUnreadMessages = async (req, res) => {
  const messages = await Message.find({
    receiver: req.user.id,
    isRead: false
  });

  res.json(messages);
};

/**
 * Mark all unread messages as read for logged-in user
 */
exports.markAsRead = async (req, res, next) => {
  try {
    await Message.updateMany(
      {
        receiver: req.user.id,
        isRead: false
      },
      {
        $set: { isRead: true }
      }
    );

    res.json({
      message: "Messages marked as read"
    });
  } catch (err) {
    next(err); // central error handler
  }
};

// Fetch full message history between two users
exports.getChatHistory = async (req, res) => {
  const { user1, user2 } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ]
    }).sort({ createdAt: 1 }); // oldest → newest

    res.json(messages);

  } catch (err) {
    console.error("Chat history error:", err);
    res.status(500).json({ message: "Server error" });
  }
};