import React, { useState, useEffect } from "react";

export default function SocketInfo({ socket }) {
  const [isHidden, setIsHidden] = useState(false);
  // Sockets Related
  const [mySocketID, setMySocketID] = useState("");
  useEffect(() => {
    const handleSocketID = (id) => {
      setMySocketID(id);
    };

    socket.on("me", handleSocketID);

    return () => {
      socket.off("me", handleSocketID);
    };
  }, []);

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
        </div>
      )}
    </div>
  );
}
