require("dotenv").config();

const cluster = require("cluster");
const totalCPUs = require("os").cpus().length;
const PORT = process.env.PORT || 8000;

let userIdSocketIdMap = new Map();

start();

function start() {
  const express = require("express");
  const cors = require("cors");
  const app = express();
  const server = require("http").createServer(app);
  app.use(cors());
  app.use(express.json());
  const options = {
    cors: true,
    origins: "*:*",
  };
  const io = require("socket.io")(server, options);

  console.log(` ${process.pid} started`);
  app.use("/", (req, res) => {
    res.send({
      message: "Welcome to chat app",
      processId: process.pid,
    });
  });

  const addUserId = (id, socket_id) => {
    userIdSocketIdMap.set(id, socket_id);
  };

  const removeUserIdViaSocketId = (socket_id) => {
    userIdSocketIdMap.forEach((value, key) => {
      if (value === socket_id) {
        userIdSocketIdMap.delete(key);
      }
    });
  };

  const getSocketIdViaUserId = (id) => {
    return userIdSocketIdMap.get(id);
  };

  io.on("connection", (socket) => {
    console.log("Socket connected: " + socket.id);

    socket.on("add-id", ({ id }) => {
      if (userIdSocketIdMap.has(id)) {
        console.log("User Id already exists: " + id);
        return;
      }
      console.log("Adding User Id to Users List: " + id);
      addUserId(id, socket.id);
    });

    socket.on("send", ({ id, messageBody }) => {
      const receiverSocketId = getSocketIdViaUserId(id);

      if (receiverSocketId !== undefined)
        io.to(receiverSocketId).emit("receive", { messageBody });
    });
    socket.on("disconnect", () => {
      console.log("Socket disconnected: " + socket.id);
      users = removeUserIdViaSocketId(socket.id);
    });
  });

  server.listen(PORT, () => console.log(`running on port ${PORT}`));
}
