require("module-alias/register"); // 🔥 must be first line

const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const { Server } = require("socket.io");

const connectDB = require("@config/db"); // ✅ DB config file

dotenv.config();

/* ===============================
   APP & SERVER
================================ */
const app = express();
const server = http.createServer(app);

/* ===============================
   SOCKET.IO
================================ */
const io = new Server(server, {
  cors: {
    origin: "*", // later frontend URL
    methods: ["GET", "POST"]
  }
});

/* ===============================
   DATABASE CONNECTION
================================ */
connectDB(); // ✅ single responsibility

/* ===============================
   MIDDLEWARES
================================ */
app.use(cors());
app.use(express.json());
app.use(helmet());


/* ===============================
   ROUTES
================================ */
app.use("/api/auth", require("@routes/authRoutes"));
app.use("/api/users", require("@routes/userRoutes"));
app.use("/api/chat", require("@routes/chatRoutes"));
app.use(require("@middleware/errorHandler"));

/* ===============================
   SOCKET LOGIC
================================ */
require("@socket/socket")(io);

/* ===============================
   BASE ROUTE
================================ */
app.get("/", (req, res) => {
  res.send("Server is running");
});

/* ===============================
   START SERVER
================================ */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
