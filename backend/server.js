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

const listOfUsers = {};
const listOfRooms = {};

app.get("/", (req, res) => {
  res.send("Server is currently running");
});

io.on("connection", (socket) => {
  console.log(socket.id, "connected to socket");

  socket.emit("me", socket.id);

  // Name Handler
  socket.on("add-user", ({ socketID, localName }) => {
    listOfUsers[socketID] = { name: localName, currentRoom: null };
    console.log(listOfUsers);
  });

  // Room Handler - Create Room
  socket.on("create-room", (callback) => {
    const user = listOfUsers[socket.id];

    if (user.currentRoom) {
      socket.leave(user.currentRoom);
      const oldRoom = listOfRooms[user.currentRoom];
      if (oldRoom) {
        oldRoom.members = oldRoom.members.filter((id) => id !== socket.id);
        if (oldRoom.members.length === 0) {
          delete listOfRooms[user.currentRoom];
          console.log(`Room ${user.currentRoom} deleted`);
        }
      }
      console.log(`${socket.id} left room ${user.currentRoom}`);
    }

    // create room
    const roomId = uuidv4();
    listOfRooms[roomId] = {
      members: [socket.id],
      host: socket.id,
    };
    user.currentRoom = roomId;
    socket.join(roomId);
    console.log(`${socket.id} created and joined room ${roomId}`);
    callback(roomId);
  });

  // Room Handler - Join Room
  socket.on("join-room", (roomId, callback) => {
    const room = listOfRooms[roomId];
    const user = listOfUsers[socket.id];

    if (room) {
      if (room.members.includes(socket.id)) {
        console.log(`${socket.id} is already in room ${roomId}`);
        callback({ success: false, message: "Already in room" });
        return;
      }

      if (room.members.length < 2) {
        if (user.currentRoom) {
          socket.leave(user.currentRoom);
          const oldRoom = listOfRooms[user.currentRoom];
          if (oldRoom) {
            oldRoom.members = oldRoom.members.filter((id) => id !== socket.id);
            if (oldRoom.members.length === 0) {
              delete listOfRooms[user.currentRoom];
              console.log(`Room ${user.currentRoom} deleted`);
            }
          }
          console.log(`${socket.id} left room ${user.currentRoom}`);
        }

        room.members.push(socket.id);
        user.currentRoom = roomId;
        socket.join(roomId);
        console.log(`${socket.id} joined room ${roomId}`);
        callback({ success: true });
      } else {
        console.log(`${socket.id} tried to join a full room ${roomId}`);
        callback({ success: false, message: "Room is full" });
      }
    } else {
      console.log(`Room ${roomId} does not exist`);
      callback({ success: false, message: "Room does not exist" });
    }
  });

  // Room Handler - Leave Room
  socket.on("leave-room", (roomId) => {
    const room = listOfRooms[roomId];
    const user = listOfUsers[socket.id];

    if (room && user.currentRoom === roomId) {
      const index = room.members.indexOf(socket.id);
      if (index !== -1) {
        room.members.splice(index, 1);
        socket.leave(roomId);
        console.log(`${socket.id} left room ${roomId}`);
        console.log(listOfRooms);
        if (room.members.length === 0 || socket.id === room.host) {
          room.members.forEach((peer) => {
            socket.to(peer).emit("room-closed", roomId);
          });
          delete listOfRooms[roomId];
          console.log(`Room ${roomId} deleted`);
        } else {
          room.members.forEach((peer) => {
            socket.to(peer).emit("peer-left", socket.id);
          });
          socket.emit("peer-left", socket.id);
        }
        user.currentRoom = null;
      }
    }
  });

  // RTC - Offer
  socket.on("offer", (offer) => {
    const user = listOfUsers[socket.id];
    const room = listOfRooms[user.currentRoom];
    if (room) {
      const otherPeer = room.members.find((peer) => peer !== socket.id);
      if (otherPeer) {
        socket.to(otherPeer).emit("offer", offer);
      }
    }
  });

  // RTC - Answer
  socket.on("answer", (answer) => {
    const user = listOfUsers[socket.id];
    const room = listOfRooms[user.currentRoom];
    if (room) {
      const otherPeer = room.members.find((peer) => peer !== socket.id);
      if (otherPeer) {
        socket.to(otherPeer).emit("answer", answer);
      }
    }
  });

  // ICE Candidates Handler
  socket.on("ice-candidate", (candidate) => {
    const user = listOfUsers[socket.id];
    const room = listOfRooms[user.currentRoom];
    if (room) {
      const otherPeer = room.members.find((peer) => peer !== socket.id);
      if (otherPeer) {
        socket.to(otherPeer).emit("ice-candidate", candidate);
      }
    }
  });

  // Disconnect Handler
  socket.on("disconnect", () => {
    console.log(socket.id, "disconnected from socket");

    // handle remove user from list of users
    delete listOfUsers[socket.id];

    // handle on disconnect room removal
    for (const roomId in listOfRooms) {
      const room = listOfRooms[roomId];
      const index = room.members.indexOf(socket.id);
      if (index !== -1) {
        room.members.splice(index, 1);
        console.log(`${socket.id} removed from room ${roomId}`);
        if (room.members.length === 0) {
          delete listOfRooms[roomId]; // remove room when room is empty
          console.log(`Room ${roomId} deleted`);
        }
        break;
      }
    }
  });
});

server.listen(serverPort, () => {
  console.log(`Server is running on port ${serverPort}`);
});

// Connect ✅
// Disconnect ✅
// Name Handler ✅
// Room Handler ✅

// Need to spend more time looking into:
// Peer Handler*
// RTCPeerConnection - https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection
// ICE Candidates
// STUN - https://dev.to/alakkadshaw/google-stun-server-list-21n4
// TURN
