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
      socket.emit("room-created", { roomID, isHost: true });
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

        const hostSocketID = listOfRooms[roomID].socketIDHost;
        if (hostSocketID) {
          io.to(hostSocketID).emit("peer-joined");
        }
      } else {
        socket.emit("room-full", { success: false, message: "Room is full." });
      }
    } else {
      socket.emit("room-not-found", { success: false, message: "Room does not exist." });
    }
  });

  // leave room
  socket.on("leave-room", ({ roomID }) => {
    const room = listOfRooms[roomID];

    if (room) {
      const { socketIDHost, socketIDPeer } = room;

      delete listOfUsersInRoom[socketIDHost];
      delete listOfUsersInRoom[socketIDPeer];

      io.to(roomID).emit("force-leave-room", { message: "someone has left, closing room." });

      for (const userSocketID of [socketIDHost, socketIDPeer]) {
        const userSocket = io.sockets.sockets.get(userSocketID);
        if (userSocket) {
          userSocket.leave(roomID);
        }
      }
      delete listOfRooms[roomID];

      io.emit("all-rooms", listOfRooms);
      io.emit("all-users", listOfUsersInRoom);
    }
  });

  // ready to accept
  socket.on("peer-ready-to-accept", ({ roomID }) => {
    const user = listOfUsersInRoom[socket.id];
    const room = listOfRooms[roomID];

    if (room) {
      // Determine who the initiator is
      const initiatorSocketID = room.socketIDHost === socket.id ? room.socketIDPeer : room.socketIDHost;

      // Emit to the initiator that the peer is ready
      if (initiatorSocketID) {
        io.to(initiatorSocketID).emit("peer-is-ready", { roomID });
      }
    } else {
      console.log(`Room ${roomID} not found for peer-ready-to-accept.`);
    }
  });

  // handle offer
  socket.on("offer", ({ offer }) => {
    const user = listOfUsersInRoom[socket.id];
    const room = listOfRooms[user.currentRoom];
    console.log(socket.id, "Received offer to be sent");
    if (room) {
      const offerTo = () => {
        if (socket.id === room.socketIDHost) {
          return room.socketIDPeer;
        } else {
          return room.socketIDHost;
        }
      };
      const targetSocketID = offerTo();
      console.log(socket.id, "Sending offer to", targetSocketID);
      socket.to(targetSocketID).emit("offer", { offer });
    } else {
      console.log(`Room ${room} not found for offer.`);
    }
  });

  // handle answer
  socket.on("answer", ({ answer }) => {
    const user = listOfUsersInRoom[socket.id];
    const room = listOfRooms[user.currentRoom];
    console.log(socket.id, "Received answer to be sent");
    if (room) {
      // console.log("answer", answer);
      const offerTo = () => {
        if (socket.id === room.socketIDHost) {
          return room.socketIDPeer;
        } else {
          return room.socketIDHost;
        }
      };
      const targetSocketID = offerTo();
      console.log(socket.id, "Sending answer to", targetSocketID);
      socket.to(targetSocketID).emit("answer", { answer });
    } else {
      console.log(`Room ${room} not found for answer.`);
    }
  });

  // handle ICE candidate exchange
  socket.on("ice-candidate", ({ candidate }) => {
    const user = listOfUsersInRoom[socket.id];
    const room = listOfRooms[user.currentRoom];
    // console.log(socket.id, "Received candidate for room");
    if (room) {
      // console.log("candidate", candidate);
      const offerTo = () => {
        if (socket.id === room.socketIDHost) {
          return room.socketIDPeer;
        } else {
          return room.socketIDHost;
        }
      };
      const targetSocketID = offerTo();
      socket.to(targetSocketID).emit("ice-candidate", { candidate });
    } else {
      console.log(`Room ${room} not found for ICE candidate.`);
    }
  });

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

//////////////////////////////////////////////////////////////////////////////
// Comments
//////////////////////////////////////////////////////////////////////////////

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

//////////////////////////////////////////////////////////////////////////////
// Layout for objects
//////////////////////////////////////////////////////////////////////////////

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
//////////////////////////////////////////////////////////////////////////////
// Steps to set up RTCPeerConnection: document what I did to make it functional for future reference.
//////////////////////////////////////////////////////////////////////////////

/*
Create the stun server configuration for my RTCPeerConnection:
 const configuration = {
      iceServers: [{ urls: "stun:stun1.google.com:19302" }],
    };

Create the connection:
  rtcPeerConnection.current = new RTCPeerConnection(configuration);

Now i need to create the onicecandidate:
  rtcPeerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { candidate: event.candidate });
      }
    };

add remote track to remote video reference:
  rtcPeerConnection.current.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (peerVideo.current) {
        peerVideo.current.srcObject = remoteStream;
      }
    };

Now we need to set up our media stream for local track:
  const getMediaStream = async () => {
            try {
                const currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (myVideo.current) {
                    myVideo.current.srcObject = currentStream;
                }
            } catch (error) {
                console.error('error:', error);
            }
        };
        getMediaStream();


Now get the current local track and add it to peer connection:
  // clear existing tracks first
  const existingSenders = rtcPeerConnection.current.getSenders();
          existingSenders.forEach((sender) => {
            rtcPeerConnection.current.removeTrack(sender);
          });
  // then we add the tracks
  currentStream.getTracks().forEach((track) => {
          rtcPeerConnection.current.addTrack(track, currentStream);
        });

For the host or whatever (user1), create an offer when peer joins the room:
  const createOffer = async () => {
    try {
      const offer = await rtcPeerConnection.current.createOffer();
      await rtcPeerConnection.current.setLocalDescription(offer);
      socket.emit("offer", { offer });
      console.log("Sending offer:", offer);
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  };

When offer is created, the other end (user2) needs to receive the offer to set remote description and create an answer to set as local description + reply with an answer
  socket.on("offer", async ({ offer }) => {
      console.log(socket.id, "Received offer for room");
      try {
        await rtcPeerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));

        // create answer
        const answer = await rtcPeerConnection.current.createAnswer();
        await rtcPeerConnection.current.setLocalDescription(answer);

        // send answer back
        socket.emit("answer", { answer });
        console.log("Sending answer:", answer);
      } catch (error) {
        console.error("Error handling offer:", error);
      }
    });

Now the host or whatever(user1) needs to receive the answer and set it as remote description:
  socket.on("answer", async ({ answer }) => {
      console.log("Received answer for room:", answer);
      try {
        await rtcPeerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error("Error setting remote description for answer:", error);
      }
    });

Finally we need to exchange ice candidates:
  socket.on("ice-candidate", ({ candidate }) => {
      if (rtcPeerConnection.current) {
        rtcPeerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

*/
