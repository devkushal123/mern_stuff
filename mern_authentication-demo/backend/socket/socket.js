const Message = require("@models/Message");

const onlineUsers = new Map(); // userId -> socketId

module.exports = (io) => {
  io.of("/chat").on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join", (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
    });

    socket.on("sendMessage", async (data) => {
      const message = await Message.create({
        sender: data.sender,
        receiver: data.receiver,
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
      }
    });

    socket.on("disconnect", () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
      }
    });
  });
};
