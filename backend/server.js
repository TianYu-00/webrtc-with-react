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

  // Name Handler
  socket.on("add-user", ({ socketID, localName, roomID }) => {
    listOfUsersInRoom[socketID] = { name: localName, currentRoom: roomID };
    // console.log(listOfUsersInRoom);
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
      console.log("list of rooms:", listOfRooms);
    } else {
      console.log("User not found");
    }
  });

  // join room
  socket.on("join-room", ({ roomID }) => {
    console.log(roomID);
    if (listOfRooms.hasOwnProperty(roomID)) {
      if (listOfRooms[roomID].socketIDPeer === undefined) {
        listOfRooms[roomID].socketIDPeer = socket.id;
        socket.join(roomID);
        socket.emit("room-joined", { success: true, message: "Joined room." });
        // still need to alert the host that someone has joined but ill do that later.
      } else {
        console.log("Room is full");
        socket.emit("room-full", { success: false, message: "Room is full." });
      }
    } else {
      console.log("Room does not exist");
      socket.emit("room-not-found", { success: false, message: "Room does not exist." });
    }
  });

  // leave room
  socket.on("leave-room", ({ roomID }) => {
    if (socket.id === listOfRooms[roomID].socketIDHost) {
      delete listOfRooms[roomID];
      console.log("Host left the room");
      // ok so i would need to add some more logic here to handle host leaving
      // maybe like close the room down or whatever.
    } else if (socket.id === listOfRooms[roomID].socketIDPeer) {
      // need to alert host that peer has left

      // handle it locally
      listOfRooms[roomID].socketIDPeer = undefined;
      delete listOfUsersInRoom[socket.id];
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
