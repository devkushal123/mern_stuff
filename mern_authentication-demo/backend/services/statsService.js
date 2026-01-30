const User = require("../models/User");
const Message = require("../models/Message");
const { TIMEZONE, mapDocsToSeries } = require("../utils/dateUtils");

// -----------------------------
// User-scoped service functions
// -----------------------------
async function getUserInboxMetrics(userId) {
  const [unreadReceived, totalReceived] = await Promise.all([
    Message.countDocuments({ receiver: userId, isRead: false }),
    Message.countDocuments({ receiver: userId }),
  ]);
  const readReceived = Math.max(totalReceived - unreadReceived, 0);
  return { totalReceived, unreadReceived, readReceived };
}

async function getUserSentStatus(userId) {
  const [sentTotal, deliveredSent, readSent] = await Promise.all([
    Message.countDocuments({ sender: userId }),
    Message.countDocuments({ sender: userId, isDelivered: true }),
    Message.countDocuments({ sender: userId, isRead: true }),
  ]);
  const pending = Math.max(sentTotal - deliveredSent, 0);
  return { sentTotal, delivered: deliveredSent, read: readSent, pending };
}

async function getUserDailyTrends(userId, start, endExclusive, labels) {
  const [sentRaw, recvRaw] = await Promise.all([
    Message.aggregate([
      { $match: { sender: userId, createdAt: { $gte: start, $lt: endExclusive } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TIMEZONE } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Message.aggregate([
      { $match: { receiver: userId, createdAt: { $gte: start, $lt: endExclusive } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TIMEZONE } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);
  return {
    sentPerDay: mapDocsToSeries(labels, sentRaw),
    receivedPerDay: mapDocsToSeries(labels, recvRaw),
  };
}

async function getTopContacts(userId, limit = 5) {
  // NOTE: If your User collection name differs, replace "users" below accordingly.
  const results = await Message.aggregate([
    { $match: { $or: [{ sender: userId }, { receiver: userId }] } },
    {
      $project: {
        other: { $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"] },
      },
    },
    { $group: { _id: "$other", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: { $ifNull: ["$user.name", "Unknown"] },
        email: { $ifNull: ["$user.email", ""] },
        count: 1,
      },
    },
  ]);

  return results.map((r) => ({
    name: r.name || r.email || "Unknown",
    count: r.count,
  }));
}

async function getUserHourlyHeatmap(userId) {
  const raw = await Message.aggregate([
    { $match: { $or: [{ sender: userId }, { receiver: userId }] } },
    {
      $group: {
        _id: {
          dow: { $isoDayOfWeek: "$createdAt" }, // 1..7
          hour: { $hour: { date: "$createdAt", timezone: TIMEZONE } }, // 0..23
        },
        value: { $sum: 1 },
      },
    },
    { $sort: { "_id.dow": 1, "_id.hour": 1 } },
  ]);

  return raw.map((r) => ({
    day: r._id.dow,
    hour: r._id.hour,
    value: r.value,
  }));
}

// -------------------------------------
// Global / Manager / Admin service fns
// -------------------------------------
async function getGlobalTotals() {
  const [totalUsers, totalMessages, unreadMessages] = await Promise.all([
    User.countDocuments(),
    Message.countDocuments(),
    Message.countDocuments({ isRead: false }),
  ]);

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const activeSenderIds = await Message.distinct("sender", { createdAt: { $gte: since24h } });
  const activeUsers24h = activeSenderIds.length;

  return { totalUsers, totalMessages, unreadMessages, activeUsers24h };
}

async function getGlobalTrend(start, endExclusive, labels) {
  const trendRaw = await Message.aggregate([
    { $match: { createdAt: { $gte: start, $lt: endExclusive } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TIMEZONE } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return mapDocsToSeries(labels, trendRaw);
}

async function getReadVsUnread() {
  const [read, unread] = await Promise.all([
    Message.countDocuments({ isRead: true }),
    Message.countDocuments({ isRead: false }),
  ]);
  return { read, unread };
}

async function getTopSenders(limit = 5) {
  // NOTE: If your User collection name differs, replace "users" below accordingly.
  const results = await Message.aggregate([
    { $group: { _id: "$sender", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: { $ifNull: ["$user.name", "Unknown"] },
        email: { $ifNull: ["$user.email", ""] },
        count: 1,
      },
    },
  ]);

  return results.map((r) => ({
    name: r.name || r.email || "Unknown",
    count: r.count,
  }));
}

async function getGlobalHourlyHeatmap() {
  const raw = await Message.aggregate([
    {
      $group: {
        _id: {
          dow: { $isoDayOfWeek: "$createdAt" },
          hour: { $hour: { date: "$createdAt", timezone: TIMEZONE } },
        },
        value: { $sum: 1 },
      },
    },
    { $sort: { "_id.dow": 1, "_id.hour": 1 } },
  ]);

  return raw.map((r) => ({
    day: r._id.dow,
    hour: r._id.hour,
    value: r.value,
  }));
}

module.exports = {
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
};