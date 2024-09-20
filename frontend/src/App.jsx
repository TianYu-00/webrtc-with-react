import React, { useEffect, useState } from "react";
import Home from "./pages/Home";
import Room from "./pages/Room";
import SocketInfo from "./components/SocketInfo";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { socket } from "./socket";

const App = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [mySocketID, setMySocketID] = useState(null);

  useEffect(() => {
    const handleSocketID = (id) => {
      setMySocketID(id);
    };

    socket.on("me", handleSocketID);

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return (
    <BrowserRouter>
      <SocketInfo socket={socket} />
      <Routes>
        <Route path="/" element={<Home socket={socket} mySocketID={mySocketID} />} />
        <Route path="/room/:roomID" element={<Room socket={socket} mySocketID={mySocketID} />} />
        {/* <Route path="/playground" element={<PlayGround />} /> */}
      </Routes>
    </BrowserRouter>
  );
};

export default App;
