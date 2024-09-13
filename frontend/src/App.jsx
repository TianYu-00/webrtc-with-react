import React, { useEffect, useState } from "react";
import Home from "./pages/Home";
import Room from "./pages/Room";
import SocketInfo from "./components/SocketInfo";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { socket } from "./socket";

const App = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
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
        <Route path="/" element={<Home socket={socket} />} />
        <Route path="/room/:roomId" element={<Room socket={socket} />} />
        {/* <Route path="/playground" element={<PlayGround />} /> */}
      </Routes>
    </BrowserRouter>
  );
};

export default App;
