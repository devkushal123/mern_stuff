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
