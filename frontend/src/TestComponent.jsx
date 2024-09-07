import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { uniqueNamesGenerator, adjectives, colors, animals } from "unique-names-generator";
import { v4 as uuidv4 } from "uuid";

const socket = io("http://localhost:5000");

export default function PlayGround() {
  const [stream, setStream] = useState(null);
  const [me, setMe] = useState("");
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const myVideo = useRef();
  const remoteVideo = useRef();
  const peerConnection = useRef(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        myVideo.current.srcObject = currentStream;

        // RTCPeerConnection
        peerConnection.current = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        // Add local tracks to the peer connection
        currentStream.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, currentStream);
        });

        // Handle incoming tracks
        peerConnection.current.ontrack = (event) => {
          remoteVideo.current.srcObject = event.streams[0];
        };

        // Handle ICE candidates
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", event.candidate);
          }
        };
      })
      .catch((error) => {
        console.log("Camera/Audio Rejected!", error);
      });

    socket.on("me", (id) => {
      setMe(id);
    });

    socket.on("offer", async (offer) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.emit("answer", answer);
      }
    });

    socket.on("answer", async (answer) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on("ice-candidate", (candidate) => {
      if (peerConnection.current) {
        peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    const newName = GenerateName();
    setName(newName);
  }, []);

  useEffect(() => {
    if (me && name) {
      socket.emit("add-user", { socketID: me, localName: name });
    }
  }, [me, name]);

  const createRoom = () => {
    socket.emit("create-room", (newRoomID) => {
      setRoomId(newRoomID);
      console.log(`Room created with ID: ${newRoomID}`);
      navigator.clipboard.writeText(newRoomID);
    });
  };

  const joinRoom = () => {
    socket.emit("join-room", roomId, (response) => {
      if (response.success) {
        console.log(`Joined room: ${roomId}`);
        // Create an offer to send to the other peer
        peerConnection.current
          .createOffer()
          .then((offer) => peerConnection.current.setLocalDescription(offer))
          .then(() => {
            socket.emit("offer", peerConnection.current.localDescription);
          });
      } else {
        console.log(`Failed to join room: ${response.message}`);
      }
    });
  };

  const leaveRoom = () => {
    socket.emit("leave-room", roomId);
    setRoomId("");
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
  };

  return (
    <div className="flex flex-col items-center">
      <p className="mb-4">My ID: {me}</p>
      <p className="mb-4">My NAME: {name}</p>
      <input
        type="text"
        placeholder="Enter Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        className="mb-4"
      />
      <button onClick={copyRoomId} className="mb-4 bg-orange-500 text-white p-2">
        Copy Room ID
      </button>
      <button onClick={createRoom} className="mb-4 bg-green-500 text-white p-2">
        Create Room
      </button>
      <button onClick={joinRoom} className="mb-4 bg-blue-500 text-white p-2">
        Join Room
      </button>
      <button onClick={leaveRoom} className="mb-4 bg-red-500 text-white p-2">
        Leave Room
      </button>
      <div className="max-w-md bg-gray-800 flex items-center justify-center">
        <video playsInline muted ref={myVideo} autoPlay className="aspect-video object-cover" />
      </div>
      <div className="max-w-md bg-gray-800 flex items-center justify-center">
        <video playsInline ref={remoteVideo} autoPlay className="aspect-video object-cover" />
      </div>
      <div>
        <p>Users In Room:</p>
      </div>
    </div>
  );
}

function GenerateName() {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: "_",
    length: 3,
  });
}
