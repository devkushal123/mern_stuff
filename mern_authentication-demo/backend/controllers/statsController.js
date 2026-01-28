// controllers/statsController.js
const User = require("../models/User");
const Message = require("../models/Message");

// ---- Date helpers (no external libs) ----
function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function formatYYYYMMDD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

exports.getStats = async (req, res) => {
  try {
    const { id: userId, role } = req.user || {};
    if (!userId || !role) {
      return res.status(401).json({ message: "Unauthorized: missing user context" });
    }

    // window (default last 30 days)
    const { from, to } = req.query || {};
    const now = new Date();
    const end = to ? startOfDay(new Date(to)) : startOfDay(now);
    const start = from ? startOfDay(new Date(from)) : startOfDay(addDays(end, -29));
    const dayCount = Math.round((end - start) / (24 * 3600 * 1000)) + 1;

    // Build common labels
    const labels = [];
    for (let i = 0; i < dayCount; i++) labels.push(formatYYYYMMDD(addDays(start, i)));

    // =========================
    // PERSONAL DASHBOARD (role: user)
    // =========================
    if (role === "user") {
      // 1) Inbox metrics (received by me)
      const [unreadReceived, totalReceived] = await Promise.all([
        Message.countDocuments({ receiver: userId, isRead: false }),
        Message.countDocuments({ receiver: userId }),
      ]);
      const readReceived = totalReceived - unreadReceived;

      // 2) Sent status (sent by me)
      const [sentTotal, deliveredSent, readSent] = await Promise.all([
        Message.countDocuments({ sender: userId }),
        Message.countDocuments({ sender: userId, isDelivered: true }),
        Message.countDocuments({ sender: userId, isRead: true }), // if receiver read it
      ]);
      const pendingSent = Math.max(sentTotal - deliveredSent, 0);

      // 3) Trend: sent and received per day
      const [sentRaw, recvRaw] = await Promise.all([
        Message.aggregate([
          { $match: { sender: userId, createdAt: { $gte: start, $lt: addDays(end, 1) } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Message.aggregate([
          { $match: { receiver: userId, createdAt: { $gte: start, $lt: addDays(end, 1) } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);
      const sentMap = new Map(sentRaw.map(r => [r._id, r.count]));
      const recvMap = new Map(recvRaw.map(r => [r._id, r.count]));
      const sentPerDay = labels.map(l => sentMap.get(l) || 0);
      const receivedPerDay = labels.map(l => recvMap.get(l) || 0);

      // 4) Top contacts (people I chat with most)
      // count messages where I'm either sender or receiver, group by counterpart
      const topContactsRaw = await Message.aggregate([
        {
          $match: {
            $or: [{ sender: userId }, { receiver: userId }],
          },
        },
        {
          $project: {
            other: {
              $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"],
            },
          },
        },
        { $group: { _id: "$other", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);
      const topContacts = await Promise.all(
        topContactsRaw.map(async r => {
          const u = await User.findById(r._id).select("name email");
          return { name: u?.name || u?.email || "Unknown", count: r.count };
        })
      );

      // 5) Heatmap: my activity (sent OR received)
      const myHeatRaw = await Message.aggregate([
        {
          $match: {
            $or: [{ sender: userId }, { receiver: userId }],
          },
        },
        {
          $group: {
            _id: {
              dow: { $isoDayOfWeek: "$createdAt" }, // 1..7 Mon..Sun
              hour: { $hour: "$createdAt" },        // 0..23
            },
            value: { $sum: 1 },
          },
        },
        { $sort: { "_id.dow": 1, "_id.hour": 1 } },
      ]);
      const hourlyHeatmap = myHeatRaw.map(r => ({
        day: r._id.dow,
        hour: r._id.hour,
        value: r.value,
      }));

      return res.json({
        scope: "Personal",
        // Inbox
        inbox: {
          totalReceived,
          unreadReceived,
          readReceived,
        },
        // Sent status
        sentStatus: {
          sentTotal,
          delivered: deliveredSent,
          read: readSent,
          pending: pendingSent,
        },
        // Trend
        trend: {
          labels,
          sentPerDay,
          receivedPerDay,
        },
        // Lists
        topContacts,
        // Heatmap
        hourlyHeatmap,
      });
    }

    // ===========================================
    // MANAGER / ADMIN (keep your existing behavior)
    // ===========================================
    // Totals (global or team—depending on your role scoping)
    const totalUsers = await User.countDocuments();
    const totalMessages = await Message.countDocuments();
    const unreadMessages = await Message.countDocuments({ isRead: false });
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeSenderIds = await Message.distinct("sender", { createdAt: { $gte: since24h } });
    const activeUsers24h = activeSenderIds.length;

    const trendRaw = await Message.aggregate([
      { $match: { createdAt: { $gte: start, $lt: addDays(end, 1) } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const trendMap = new Map(trendRaw.map(r => [r._id, r.count]));
    const data = labels.map(l => trendMap.get(l) || 0);

    const read = await Message.countDocuments({ isRead: true });
    const unread = unreadMessages;

    const topSendersRaw = await Message.aggregate([
      { $group: { _id: "$sender", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);
    const topSenders = await Promise.all(
      topSendersRaw.map(async (r) => {
        const u = await User.findById(r._id).select("name email");
        return { name: u?.name || u?.email || "Unknown", count: r.count };
      })
    );

    const hourlyRaw = await Message.aggregate([
      {
        $group: {
          _id: {
            dow: { $isoDayOfWeek: "$createdAt" },
            hour: { $hour: "$createdAt" },
          },
          value: { $sum: 1 },
        },
      },
      { $sort: { "_id.dow": 1, "_id.hour": 1 } },
    ]);
    const hourlyHeatmap = hourlyRaw.map(r => ({
      day: r._id.dow,
      hour: r._id.hour,
      value: r.value,
    }));

    return res.json({
      scope: "Global",
      totalUsers,
      totalMessages,
      unreadMessages,
      activeUsers24h,
      last30Days: { labels, data },
      readVsUnread: { read, unread },
      topSenders,
      hourlyHeatmap,
    });
  } catch (e) {
    console.error("Stats error:", e);
    res.status(500).json({ message: "Stats error" });
  }
};