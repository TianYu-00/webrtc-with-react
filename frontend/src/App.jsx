import React, { useEffect } from "react";
import Home from "./pages/Home";
import Room from "./pages/Room";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<Room />} />
        {/* <Route path="/playground" element={<PlayGround />} /> */}
      </Routes>
    </BrowserRouter>
  );
};

export default App;
