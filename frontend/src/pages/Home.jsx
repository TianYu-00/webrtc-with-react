import React, { useState, useEffect } from "react";
import { uniqueNamesGenerator, adjectives, colors, animals } from "unique-names-generator";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [roomID, setRoomID] = useState("");
  const [inputName, setInputName] = useState("");
  const [inputRoomID, setInputRoomID] = useState("");

  // Run once
  useEffect(() => {
    const newName = GenerateName();
    setName(newName);
  }, []);

  function updateName() {
    if (inputName === "") {
      // generate random name
      const newName = GenerateName();
      console.log(newName);
      setName(newName);
      return;
    }
    setName(inputName);
    console.log("Name Changed");
  }

  function JoinRoom() {
    if (roomID === "") {
      console.log("Room ID Empty");
      return;
    }
    setRoomID(inputRoomID);
    console.log("Join Room");
    navigate(`/room/${inputRoomID}`, { state: { name } });
  }

  function CreateRoom() {
    const newRoomID = uuidv4();
    navigate(`/room/${newRoomID}`, { state: { name } });
    return;
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <div className="text-gray-500">
          <h1 className="font-bold text-center m-3">WebRTC Project</h1>
        </div>

        <div className="mb-4">
          <p className="text-gray-500 text-lg font-semibold mb-2">Name: {name}</p>
          <input
            type="text"
            placeholder="New Name"
            className="border p-2 rounded-lg w-full"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white p-2 rounded-lg mt-2 w-full"
            onClick={() => {
              updateName();
            }}
          >
            Update Name
          </button>
        </div>

        <div>
          <p className="text-gray-500 text-lg font-semibold mb-2">Join Room ID</p>
          <input
            type="text"
            placeholder="Room ID"
            className="border p-2 rounded-lg w-full"
            value={inputRoomID}
            onChange={(e) => setInputRoomID(e.target.value)}
          />
          <div className="flex space-x-3 mt-2 items-center">
            <button
              className="bg-blue-500 text-white p-2 rounded-lg w-full"
              onClick={() => {
                JoinRoom();
              }}
            >
              Join Room
            </button>
            <p className="text-gray-500 text-lg font-semibold mb-2">/</p>
            <button
              className="bg-green-500 text-white p-2 rounded-lg w-full"
              onClick={() => {
                CreateRoom();
              }}
            >
              Create Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GenerateName() {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: "-",
    length: 3,
  });
}
