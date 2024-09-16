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
const listOfUsers = {};
const listOfRooms = {};

app.get("/", (req, res) => {
  res.send("Server is currently running");
});

io.on("connection", (socket) => {
  connectedCounter++;
  console.log(connectedCounter, "users online");

  socket.emit("me", socket.id);

  io.emit("all-users-connected", connectedCounter);

  // Name Handler
  socket.on("add-user", ({ socketID, localName, roomID }) => {
    listOfUsers[socketID] = { name: localName, currentRoom: roomID };
    console.log(listOfUsers);
  });

  // Room handler

  // create room

  // join room

  // leave room

  // offer

  // answer

  // ice-candidate

  // Disconnect Handler
  socket.on("disconnect", () => {
    connectedCounter--;
    console.log(socket.id, "disconnected");
    io.emit("all-users-connected", connectedCounter);
    delete listOfUsers[socket.id];
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

// More info on media devices
// https://webrtc.org/getting-started/media-devices#using-asyncawait_1
