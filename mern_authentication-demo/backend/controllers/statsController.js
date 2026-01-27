
const User = require("../models/User");
const Message = require("../models/Message");

/**
 * GET /api/stats
 * Returns dashboard stats + last 7 days messages chart data
 */
exports.getStats = async (req, res) => {
  try {
    // Basic counts
    const [totalUsers, totalMessages, unreadMessages, deliveredMessages] =
      await Promise.all([
        User.countDocuments(),//// total users
        Message.countDocuments(),//// total messages sent
        Message.countDocuments({ isRead: false }),// unread messages (for analytics, not per-user)
        Message.countDocuments({ isDelivered: true }),// delivered 
      ]);
    // not delivered messages  
    const undeliveredMessages = totalMessages - deliveredMessages;

    // Today count
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const messagesToday = await Message.countDocuments({
      createdAt: { $gte: startOfToday },
    });

    // Last 7 days trend (date -> count)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 5); // includes today (7 points)
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyAgg = await Message.aggregate([
      { $match: { 
          createdAt: { 
            $gte: sevenDaysAgo 
            // $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          } 
        } 
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing dates (so chart looks continuous)
    const toYMD = (d) => d.toISOString().slice(0, 10);
    const map = new Map(dailyAgg.map((x) => [x._id, x.count]));

    const labels = [];
    const data = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(sevenDaysAgo);
      day.setDate(sevenDaysAgo.getDate() + i);

      const key = toYMD(day);
      labels.push(key);
      data.push(map.get(key) || 0);
    }

    return res.status(200).json({
      totalUsers,
      totalMessages,
      unreadMessages,
      deliveredMessages,
      undeliveredMessages,
      messagesToday,
      last7Days: { labels, data }, // ✅ perfect for charts
    });
  } catch (err) {
    console.error("Stats error:", err);
    return res.status(500).json({ error: "ServerError", message: err.message });
  }
};
