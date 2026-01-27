const Message = require("@models/Message");
const mongoose = require("mongoose");

const onlineUsers = new Map(); // userId -> socketId

module.exports = (io) => {
  io.of("/chat").on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // JOIN USER ROOM
    socket.on("join", async (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;

      // ✅ unread count send on connect
      const unreadCount = await Message.countDocuments({
        receiver: userId,
        isRead: false
      });

      socket.emit("unreadCount", unreadCount);
    });

    socket.on("sendMessage", async (data) => {
      const sender = String(data.sender);
      const receiver = String(data.receiver);
      
      // ✅ Validate ObjectId format
      if (!mongoose.isValidObjectId(sender) || !mongoose.isValidObjectId(receiver)) {
        return socket.emit("errorMessage", { error: "Invalid sender/receiver id" });
      }

      const message = await Message.create({
        sender,
        receiver,
        message: data.message
      });

      const receiverSocket = onlineUsers.get(data.receiver);

      if (receiverSocket) {
        io.of("/chat")
          .to(receiverSocket)
          .emit("receiveMessage", message);

        await Message.findByIdAndUpdate(message._id, {
          isDelivered: true
        });
        
        // ✅ send updated unread count
        const unreadCount = await Message.countDocuments({
          receiver: data.receiver,
          isRead: false
        });

        io.of("/chat").to(receiverSocket).emit("unreadCount", unreadCount);

      }
    });
    
    // When user opens chat → mark messages as read 
    socket.on("markAsRead", async ({ userId, fromUserId }) => {
      const receiver = String(userId);
      const sender = String(fromUserId);
      if (!mongoose.isValidObjectId(receiver) || !mongoose.isValidObjectId(sender)) return;

      await Message.updateMany(
        { receiver: userId, sender: fromUserId, isRead: false },
        { $set: { isRead: true } }
      );

      const unreadCount = await Message.countDocuments({
        receiver: userId,
        isRead: false
      });

      socket.emit("unreadCount", unreadCount);
    });
    socket.on("disconnect", () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
      }
    });
  });
};
