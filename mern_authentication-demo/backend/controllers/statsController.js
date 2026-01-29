const { getDateWindow } = require("../utils/dateUtils");
const {
  // user
  getUserInboxMetrics,
  getUserSentStatus,
  getUserDailyTrends,
  getTopContacts,
  getUserHourlyHeatmap,
  
  // global
  getGlobalTotals,
  getGlobalTrend,
  getReadVsUnread,
  getTopSenders,
  getGlobalHourlyHeatmap,
} = require("../services/statsService");

async function getStats(req, res) {
  try {
    const { id: userId, role } = req.user || {};
    if (!userId || !role) {
      return res.status(401).json({ message: "Unauthorized: missing user context" });
    }

    const { start, end, endExclusive, labels } = getDateWindow(req.query);

    if (role === "user") {
      const [inbox, sentStatus, trend, topContacts, hourlyHeatmap] = await Promise.all([
        getUserInboxMetrics(userId),
        getUserSentStatus(userId),
        getUserDailyTrends(userId, start, endExclusive, labels),
        getTopContacts(userId),
        getUserHourlyHeatmap(userId),
      ]);

      return res.json({
        scope: "Personal",
        inbox,
        sentStatus,
        trend: { labels, ...trend },
        topContacts,
        hourlyHeatmap,
      });
    }

    // Manager/Admin: Global view (adjust scoping for teams if required)
    const [totals, last30DaysData, readVsUnread, topSenders, hourlyHeatmap] = await Promise.all([
      getGlobalTotals(),
      getGlobalTrend(start, endExclusive, labels),
      getReadVsUnread(),
      getTopSenders(),
      getGlobalHourlyHeatmap(),
    ]);

    return res.json({
      scope: "Global",
      totalUsers: totals.totalUsers,
      totalMessages: totals.totalMessages,
      unreadMessages: totals.unreadMessages,
      activeUsers24h: totals.activeUsers24h,
      last30Days: { labels, data: last30DaysData },
      readVsUnread,
      topSenders,
      hourlyHeatmap,
    });
  } catch (e) {
    console.error("Stats error:", e);
    return res.status(500).json({ message: "Stats error" });
  }
}

module.exports = { getStats };