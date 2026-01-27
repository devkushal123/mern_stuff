const express = require("express");
const router = express.Router();

const authMiddleware = require("@middleware/authMiddleware");
const { getChatHistory, markAsRead, getUnreadMessages } = require("../controllers/chatController");

/**
 * MARK MESSAGES AS READ
 */
router.put(
  "/mark-read",
  authMiddleware,
  markAsRead
);



router.get(
  "/unread",
  authMiddleware,
  getUnreadMessages
);

// GET /api/chat/history/:user1/:user2
router.get("/history/:user1/:user2", authMiddleware, getChatHistory);


module.exports = router;