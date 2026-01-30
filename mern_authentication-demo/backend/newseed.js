/**
 * Seeder for MERN chat:
 * - Users: 1 admin, 2 managers, 4 users
 * - 400 messages across last 30 days
 * - +100 messages for this month (~75% in last 2 weeks)
 * - isDelivered/isRead realistic
 * - Admin excluded from chat messages
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Message = require("./models/Message");
const bcrypt = require("bcryptjs");

const MONGO_URI = process.env.MONGO_URI; // optional fallback handled by your env
const SALT_ROUNDS = 12;

function genObjectId() {
  const hex = "0123456789abcdef";
  let s = "";
  for (let i = 0; i < 24; i++) s += hex[Math.floor(Math.random() * hex.length)];
  return s;
}
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function connect() {
  await mongoose.connect(MONGO_URI, { autoIndex: true });
  console.log("✅ Connected:", MONGO_URI);
}

/**
 * NOTE:
 * - We are hashing passwords with bcryptjs using 12 salt rounds (same as auth).
 * - Field name used is `password` — make sure your User model expects this as the hashed value.
 */
async function generateUsers() {
  const names = ["Kushal", "Arora", "Taylor", "Morgan", "Casey", "Riley", "Sam", "Jamie"];
  const docs = [];
  let i = 0;

  // helper to create a user with hashed password
  async function makeUser({ name, email, role, plainPassword }) {
    const hashed = await bcrypt.hash(plainPassword, SALT_ROUNDS); // ✅ same as your auth
    return {
      _id: genObjectId(),
      name,
      email,
      role,
      password: hashed, // hashed password stored here
    };
  }

  // Admin
  docs.push(await makeUser({
    name: `${names[i++ % names.length]} Admin`,
    email: "admin@gmail.com",
    role: "admin",
    plainPassword: "Admin@123#",
  }));

  // Managers
  for (let k = 1; k <= 2; k++) {
    docs.push(await makeUser({
      name: `${names[i++ % names.length]} Manager ${k}`,
      email: `manager${k}@gmail.com`,
      role: "manager",
      plainPassword: "Manager@123#",
    }));
  }

  // Users
  for (let k = 1; k <= 4; k++) {
    docs.push(await makeUser({
      name: `${names[i++ % names.length]} User ${k}`,
      email: `user${k}@gmail.com`,
      role: "user",
      plainPassword: "User@123#",
    }));
  }
  return docs;
}

/**
 * Base messages: 400 in last 30 days (uniform distribution)
 */
async function generateMessages(users) {
  const now = new Date();
  const start = addDays(now, -29);
  const texts = [
    "Hey there!", "Can we meet today?", "I'll send the doc.", "Got it.",
    "Let's review the code.", "Ping me when free.", "Thanks!", "Please check.",
  ];

  const managers = users.filter(u => u.role === "manager");
  const normals  = users.filter(u => u.role === "user");

  // No admin in chat
  const pool = managers.concat(normals);

  const msgs = [];
  for (let i = 0; i < 400; i++) {
    const sender = randomChoice(pool);
    let receiver = randomChoice(pool);
    while (receiver._id === sender._id) receiver = randomChoice(pool);

    const deltaDays = Math.floor(Math.random() * 30);
    const deltaSeconds = Math.floor(Math.random() * 24 * 3600);
    const createdAt = new Date(start.getTime() + deltaDays * 86400000 + deltaSeconds * 1000);

    const ageDays = Math.floor((now - createdAt) / 86400000);
    const deliveredProb = ageDays <= 1 ? 0.6 : 0.85;
    const readProb = ageDays <= 1 ? 0.2 : 0.65;

    const isDelivered = Math.random() < deliveredProb;
    const isRead = isDelivered && Math.random() < readProb;

    msgs.push({
      _id: genObjectId(),
      sender: sender._id,
      receiver: receiver._id,
      message: randomChoice(texts),
      isDelivered,
      isRead,
      createdAt,
    });
  }
  return msgs;
}

/**
 * EXTRA messages: +100 for current month, ~75% inside last 2 weeks.
 */
async function generateRecentMonthMessages(users, extraCount = 100) {
  const now = new Date();

  // Current month start (local)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const last2WeeksStart = new Date(now.getTime() - 14 * 24 * 3600 * 1000);

  const texts = [
    "Hey there!", "Can we meet today?", "I'll send the doc.", "Got it.",
    "Let's review the code.", "Ping me when free.", "Thanks!", "Please check.",
  ];

  const managers = users.filter(u => u.role === "manager");
  const normals  = users.filter(u => u.role === "user");
  const pool = managers.concat(normals); // exclude admin

  const msgs = [];

  const countLast2Weeks = Math.round(extraCount * 0.75); // ≈75
  const countRest = extraCount - countLast2Weeks;        // ≈25

  function randomDateBetween(start, end) {
    const t = start.getTime() + Math.random() * (end.getTime() - start.getTime());
    return new Date(t);
  }

  // Clamp last2WeeksStart to monthStart if needed
  const recentStart = last2WeeksStart < monthStart ? monthStart : last2WeeksStart;

  // Generate last-2-weeks messages
  for (let i = 0; i < countLast2Weeks; i++) {
    const sender = randomChoice(pool);
    let receiver = randomChoice(pool);
    while (receiver._id === sender._id) receiver = randomChoice(pool);

    const createdAt = randomDateBetween(recentStart, now);

    const ageDays = Math.floor((now - createdAt) / 86400000);
    const deliveredProb = ageDays <= 1 ? 0.6 : 0.85;
    const readProb      = ageDays <= 1 ? 0.2 : 0.65;

    const isDelivered = Math.random() < deliveredProb;
    const isRead = isDelivered && Math.random() < readProb;

    msgs.push({
      _id: genObjectId(),
      sender: sender._id,
      receiver: receiver._id,
      message: randomChoice(texts),
      isDelivered,
      isRead,
      createdAt,
    });
  }

  // Generate remaining messages anywhere in this month (monthStart..now)
  for (let i = 0; i < countRest; i++) {
    const sender = randomChoice(pool);
    let receiver = randomChoice(pool);
    while (receiver._id === sender._id) receiver = randomChoice(pool);

    const createdAt = randomDateBetween(monthStart, now);

    const ageDays = Math.floor((now - createdAt) / 86400000);
    const deliveredProb = ageDays <= 1 ? 0.6 : 0.85;
    const readProb      = ageDays <= 1 ? 0.2 : 0.65;

    const isDelivered = Math.random() < deliveredProb;
    const isRead = isDelivered && Math.random() < readProb;

    msgs.push({
      _id: genObjectId(),
      sender: sender._id,
      receiver: receiver._id,
      message: randomChoice(texts),
      isDelivered,
      isRead,
      createdAt,
    });
  }

  return msgs;
}

async function seed() {
  try {
    await connect();

    await Promise.all([User.deleteMany({}), Message.deleteMany({})]);
    console.log("🧹 Cleared users & messages");

    const users = await generateUsers();
    const messages = await generateMessages(users);                  // base 400
    const extraRecent = await generateRecentMonthMessages(users, 100); // +100 this month (~75% last 2 weeks)
    messages.push(...extraRecent);

    await User.insertMany(users);
    await Message.insertMany(messages);

    const [userCount, msgCount, unreadCount] = await Promise.all([
      User.countDocuments(),
      Message.countDocuments(),
      Message.countDocuments({ isRead: false }),
    ]);

    console.log("✅ Seed complete:");
    console.log("  Users:", userCount);
    console.log("  Messages:", msgCount); // should be 500
    console.log("  Unread:", unreadCount);

    console.log("\n🔑 Dev login credentials (emails & plain passwords):");
    console.log("  admin@gmail.com      | Admin@123#");
    console.log("  manager1@gmail.com   | Manager@123#");
    console.log("  manager2@gmail.com   | Manager@123#");
    console.log("  user1@gmail.com      | User@123#");
    console.log("  user2@gmail.com      | User@123#");
    console.log("  user3@gmail.com      | User@123#");
    console.log("  user4@gmail.com      | User@123#");
  } catch (err) {
    console.error("❌ Seed failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected");
  }
}

seed();