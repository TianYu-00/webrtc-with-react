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
  const [peers, setPeers] = useState({});
  const myVideo = useRef();

  useEffect(() => {}, []);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        myVideo.current.srcObject = currentStream;
      })
      .catch((error) => {
        console.log("Camera/Audio Rejected!", error);
      });

    socket.on("me", (id) => {
      setMe(id);
    });

    const newName = GenerateName();
    setName(newName);
    socket.emit("set-name", newName);

    socket.on("user-joined", ({ userId, userName }) => {
      console.log(`${userId} joined the room with username of ${userName}`);
      setPeers((prevPeers) => ({
        ...prevPeers,
        [userId]: userName,
      }));
    });

    socket.on("user-left", ({ userId }) => {
      setPeers((prevPeers) => {
        const newPeers = { ...prevPeers };
        delete newPeers[userId];
        return newPeers;
      });
    });

    socket.on("all-users", (users) => {
      const newPeers = users.reduce((acc, { userId, userName }) => {
        acc[userId] = userName;
        return acc;
      }, {});
      setPeers(newPeers);
    });

    return () => {
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("all-users");
    };
  }, [peers, roomId]);

  const createRoom = () => {
    const newRoomId = uuidv4();
    setRoomId(newRoomId);
    socket.emit("join-room", newRoomId);
  };

  const joinRoom = () => {
    if (roomId) {
      socket.emit("join-room", roomId);
    }
  };

  const leaveRoom = () => {
    if (roomId) {
      socket.emit("leave-room", roomId);
      setRoomId("");
      setPeers({});
      setStream(null);
    }
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
      <div>
        <p>Users In Room:</p>
        {Object.entries(peers).map(([userId, userName]) => (
          <p key={userId}>{userName}</p>
        ))}
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
