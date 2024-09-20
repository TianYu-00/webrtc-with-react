import React, { useState, useEffect } from "react";

export default function SocketInfo({ socket }) {
  const [isHidden, setIsHidden] = useState(false);
  // Sockets Related
  const [mySocketID, setMySocketID] = useState("");
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [allUsersInRoom, setAllUsersInRoom] = useState({});
  const [allRooms, setAllRooms] = useState({});
  useEffect(() => {
    const handleSocketID = (id) => {
      setMySocketID(id);
    };

    const handleAllUsersConnected = (connectedCounter) => {
      setConnectedUsers(connectedCounter);
    };

    socket.on("me", handleSocketID);

    socket.on("all-users-connected", handleAllUsersConnected);

    socket.on("all-rooms", (data) => {
      setAllRooms(data);
    });

    socket.on("all-users", (data) => {
      setAllUsersInRoom(data);
    });

    return () => {
      socket.off("me", handleSocketID);
      socket.off("all-users-connected", handleAllUsersConnected);
      socket.off("all-users");
      socket.off("all-rooms");
    };
  }, [socket]);

  function handleHidden() {
    setIsHidden(!isHidden);
  }

  return (
    <div className="absolute top-0 left-0 z-50">
      {isHidden ? (
        <div>
          <button
            className="border pl-2 pr-2"
            onClick={() => {
              handleHidden();
            }}
          >
            Show
          </button>
        </div>
      ) : (
        <div>
          <button
            className="border pl-2 pr-2"
            onClick={() => {
              handleHidden();
            }}
          >
            Hide
          </button>
          <p>Socket Info</p>
          <p>ID: {mySocketID}</p>
          <p>Connected: {connectedUsers}</p>
          <div>
            <p>All Users In Room:</p>
            <pre>{JSON.stringify(allUsersInRoom, null, 2)}</pre>

            <p>All Rooms:</p>
            <pre>{JSON.stringify(allRooms, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
