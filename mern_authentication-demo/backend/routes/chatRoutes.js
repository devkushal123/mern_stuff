const express = require("express");
const router = express.Router();

const authMiddleware = require("@middleware/authMiddleware");
const chatController = require("@controllers/chatController");

/**
 * MARK MESSAGES AS READ
 */
router.put(
  "/mark-read",
  authMiddleware,
  chatController.markAsRead
);



router.get(
  "/unread",
  authMiddleware,
  chatController.getUnreadMessages
);

module.exports = router;