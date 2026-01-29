const Message = require("@models/Message");
const mongoose = require("mongoose");

const onlineUsers = new Map(); // userId -> socketId (single latest socket). Rooms handle multi-device.

module.exports = (io) => {
  const chat = io.of("/chat");

  chat.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // JOIN USER ROOM (prefer object: { userId })
    socket.on("join", async (payload) => {
      try {
        const userId = typeof payload === "string" ? payload : payload?.userId;
        if (!mongoose.isValidObjectId(userId)) {
          return socket.emit("errorMessage", { error: "Invalid userId" });
        }

        socket.userId = userId;

        // Track online presence (optional, latest socket only)
        onlineUsers.set(userId, socket.id);

        // Join userId room (supports multi-device)
        socket.join(String(userId));

        // Send unread count on connect
        const unreadCount = await Message.countDocuments({
          receiver: userId,
          isRead: false,
        });
        socket.emit("unreadCount", unreadCount);

        // 🔸 Deliver pending (undelivered) messages to this user
        const pending = await Message.find({
          receiver: userId,
          isDelivered: false,
        }).sort({ createdAt: 1 });

        if (pending.length) {
          // Emit all pending to this socket (or to the room)
            pending.forEach((msg) => {
              // If you want strict ack, use the ack variant below in sendMessage too:
              // socket.emit("receiveMessage", msg, async (ack) => {
              //   if (ack === true) await Message.findByIdAndUpdate(msg._id, { isDelivered: true });
              // });
              socket.emit("receiveMessage", msg);
            });

            // Mark all pending as delivered AFTER emit
            await Message.updateMany(
              { _id: { $in: pending.map((m) => m._id) } },
              { $set: { isDelivered: true } }
            );

            // Update unread count for the receiver (unchanged by delivery)
            const newUnreadCount = await Message.countDocuments({
              receiver: userId,
              isRead: false,
            });
            socket.emit("unreadCount", newUnreadCount);
        }
      } catch (err) {
        console.error("join error:", err);
        socket.emit("errorMessage", { error: "Join failed" });
      }
    });

    // SEND MESSAGE
    socket.on("sendMessage", async (data) => {
      try {
        const sender = String(data.sender);
        const receiver = String(data.receiver);
        const text = (data.message || "").trim();

        // Validate
        if (
          !mongoose.isValidObjectId(sender) ||
          !mongoose.isValidObjectId(receiver) ||
          !text
        ) {
          return socket.emit("errorMessage", { error: "Invalid sender/receiver/message" });
        }

        // Create DB record first (delivered=false by default)
        const message = await Message.create({
          sender,
          receiver,
          message: text,
        });

        // Check if receiver room has active sockets
        const room = chat.adapter.rooms.get(receiver);
        const receiverOnline = !!room && room.size > 0;

        if (receiverOnline) {
          // Emit to the receiver's room (all devices)
          // --- Simple emit (no ack) ---
          chat.to(receiver).emit("receiveMessage", message);

          // Mark delivered immediately (if you want stronger guarantee, use ack below)
          await Message.findByIdAndUpdate(message._id, { isDelivered: true });

          // Update unreadCount for receiver
          const unreadCount = await Message.countDocuments({
            receiver,
            isRead: false,
          });
          chat.to(receiver).emit("unreadCount", unreadCount);

          // --- ACK variant (uncomment to use) ---
          // chat.to(receiver).emit("receiveMessage", message, async (ack) => {
          //   if (ack === true) {
          //     await Message.findByIdAndUpdate(message._id, { isDelivered: true });
          //     const unreadCount = await Message.countDocuments({
          //       receiver,
          //       isRead: false,
          //     });
          //     chat.to(receiver).emit("unreadCount", unreadCount);
          //   }
          // });
        } else {
          // Receiver offline → keep isDelivered=false
          // Message stays pending; will be delivered on next "join"
        }

        // Confirm to sender (so their UI updates reliably)
        chat.to(sender).emit("messageSent", message);
      } catch (err) {
        console.error("sendMessage error:", err);
        socket.emit("errorMessage", { error: "Send failed" });
      }
    });

    // READ RECEIPTS: When user opens a chat thread
    socket.on("markAsRead", async ({ userId, fromUserId }) => {
      try {
        const receiver = String(userId);
        const sender = String(fromUserId);
        if (!mongoose.isValidObjectId(receiver) || !mongoose.isValidObjectId(sender)) return;

        await Message.updateMany(
          { receiver: receiver, sender: sender, isRead: false },
          { $set: { isRead: true } }
        );

        const unreadCount = await Message.countDocuments({
          receiver: receiver,
          isRead: false,
        });

        // Emit updated unread count only to this socket/user
        socket.emit("unreadCount", unreadCount);
      } catch (err) {
        console.error("markAsRead error:", err);
      }
    });

    socket.on("disconnect", () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
      }
      // Room auto-leave handled by socket.io
    });
  });
};
