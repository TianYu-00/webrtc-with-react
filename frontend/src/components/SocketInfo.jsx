import React, { useState, useEffect } from "react";

export default function SocketInfo({ socket }) {
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

  return (
    <div className="absolute">
      <p>Socket Info</p>
      <p>ID: {mySocketID}</p>
    </div>
  );
}
