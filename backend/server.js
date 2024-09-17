// my server.js file
const express = require("express");
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

let connectedCounter = 0;
const listOfUsersInRoom = {};
const listOfRooms = {};

app.get("/", (req, res) => {
  res.send("Server is currently running");
});

io.on("connection", (socket) => {
  connectedCounter++;
  console.log(connectedCounter, "users online");

  socket.emit("me", socket.id);

  io.emit("all-users-connected", connectedCounter);
  io.emit("all-rooms", listOfRooms);
  io.emit("all-users", listOfUsersInRoom);

  // Name Handler
  socket.on("add-user", ({ socketID, localName, roomID }) => {
    listOfUsersInRoom[socketID] = { name: localName, currentRoom: roomID };
    io.emit("all-users", listOfUsersInRoom);
  });

  // Room handler

  // create room
  socket.on("create-room", ({ roomID }) => {
    if (listOfUsersInRoom[socket.id]) {
      listOfRooms[roomID] = {
        socketIDHost: socket.id,
        socketIDPeer: undefined,
      };
      socket.join(roomID);
      io.emit("all-rooms", listOfRooms);
    } else {
      console.log("User not found");
    }
  });

  // join room
  socket.on("join-room", ({ roomID }) => {
    if (listOfRooms.hasOwnProperty(roomID)) {
      if (listOfRooms[roomID].socketIDPeer === undefined) {
        listOfRooms[roomID].socketIDPeer = socket.id;
        socket.join(roomID);
        socket.emit("room-joined", { success: true, message: "Joined room." });
        io.emit("all-rooms", listOfRooms);
        // still need to alert the host that someone has joined but ill do that later.
      } else {
        socket.emit("room-full", { success: false, message: "Room is full." });
      }
    } else {
      socket.emit("room-not-found", { success: false, message: "Room does not exist." });
    }
  });

  // leave room
  socket.on("leave-room", ({ roomID }) => {
    if (socket.id === listOfRooms[roomID].socketIDHost) {
      const { socketIDHost, socketIDPeer } = listOfRooms[roomID];
      delete listOfUsersInRoom[socketIDHost];
      if (socketIDPeer) {
        delete listOfUsersInRoom[socketIDPeer];
      }

      delete listOfRooms[roomID];

      io.to(roomID).emit("force-leave-room", { message: "host has left, closing room." });

      socket.leave(roomID);

      io.emit("all-rooms", listOfRooms);
      io.emit("all-users", listOfUsersInRoom);
    } else if (socket.id === listOfRooms[roomID].socketIDPeer) {
      listOfRooms[roomID].socketIDPeer = undefined;
      delete listOfUsersInRoom[socket.id];

      socket.leave(roomID);

      io.emit("all-rooms", listOfRooms);
      io.emit("all-users", listOfUsersInRoom);
    }
  });

  // offer

  // answer

  // ice-candidate

  // Disconnect Handler
  socket.on("disconnect", () => {
    connectedCounter--;
    console.log(connectedCounter, "users online");
    io.emit("all-users-connected", connectedCounter);
    delete listOfUsersInRoom[socket.id];
  });
});

server.listen(serverPort, () => {
  console.log(`Server is running on port ${serverPort}`);
});

// Need to spend more time looking into:
// Peer Handler* - https://webrtc.org/getting-started/peer-connections-advanced
// RTCPeerConnection - https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection
// ICE Candidates
// STUN - https://dev.to/alakkadshaw/google-stun-server-list-21n4
// TURN

// More info on Socket.io
// https://socket.io/how-to/use-with-react
// https://socket.io/docs/v3/emit-cheatsheet/
// https://socket.io/docs/v4/rooms/

// More info on media devices
// https://webrtc.org/getting-started/media-devices#using-asyncawait_1

// list of users
/*
  {
    socketID: {name:user-name, currentRoom: roomID}
  }
*/

// list of rooms
/*
  {
    roomID: {socketIDHost:hostSocketID, socketIDPeer:peerSocketID}
  }
*/
