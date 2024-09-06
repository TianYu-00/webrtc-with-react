const express = require("express");
const { v4: uuidv4 } = require("uuid");
const app = express();
const server = require("http").createServer(app);
const cors = require("cors");

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

const serverPort = process.env.PORT || 5000;

const userNames = {};

app.get("/", (req, res) => {
  res.send("Server is currently running");
});

// backend socket io connections
io.on("connection", (socket) => {
  socket.emit("me", socket.id);

  socket.on("set-name", (name) => {
    userNames[socket.id] = name;
  });

  socket.on("join-room", (roomId) => {
    socket.join(roomId);

    socket.to(roomId).emit("user-joined", { userId: socket.id, userName: userNames[socket.id] });

    const existingUsers = Object.entries(userNames).filter(([id]) => io.sockets.sockets.get(id)?.rooms.has(roomId));
    socket.emit(
      "all-users",
      existingUsers.map(([id, name]) => ({ userId: id, userName: name }))
    );
  });

  socket.on("leave-room", (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit("user-left", { userId: socket.id });

    delete userNames[socket.id];
  });

  socket.on("disconnect", () => {
    for (let room of socket.rooms) {
      if (room !== socket.id) {
        socket.to(room).emit("user-left", { userId: socket.id });
      }
    }

    delete userNames[socket.id];
  });
});

server.listen(serverPort, () => {
  console.log(`Server is running on port ${serverPort}`);
});
