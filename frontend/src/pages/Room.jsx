import React, { useEffect, useState, useRef } from "react";
import { BsCameraVideoFill, BsCameraVideoOffFill, BsMicFill, BsMicMuteFill, BsTelephoneXFill } from "react-icons/bs";
import { useNavigate, useLocation, useParams } from "react-router-dom";

export default function Room({ socket }) {
  const navigate = useNavigate();
  let location = useLocation();

  // Room info
  const { roomID } = useParams();

  // my info
  const [stream, setStream] = useState(null);
  const myVideo = useRef();
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [myName, setMyName] = useState("");

  // peer info
  const peerVideo = useRef();
  const [peerName, setPeerName] = useState("");

  useEffect(() => {
    const myAssignedName = location.state.name;
    setMyName(myAssignedName);
  }, []);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((currentStream) => {
      setStream(currentStream);
      myVideo.current.srcObject = currentStream;
    });
  }, []);

  function LeaveRoom() {
    navigate(`/`);
    return;
  }

  function Handle_Cam() {
    setIsVideoOn(!isVideoOn);
  }

  function Handle_Mic() {
    setIsMicOn(!isMicOn);
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Video */}
      <div className="flex flex-grow overflow-hidden">
        <div className="flex flex-col flex-grow p-2">
          <div className="flex flex-col flex-grow items-center justify-center space-y-2 overflow-hidden">
            {/* My Video */}
            <div className="w-full h-1/2 border border-gray-700 bg-black flex justify-center items-center relative">
              <video className="h-full " autoPlay muted ref={myVideo}></video>
              <div className="absolute bottom-0 left-2">
                <p>{myName}</p>
              </div>
              <div className="absolute bottom-0 right-2">
                <p>{roomID}</p>
              </div>
            </div>
            {/* Peer Video */}
            <div className="w-full h-1/2 border border-gray-700 bg-black flex justify-center items-center relative">
              <video className="h-full " autoPlay muted ref={peerVideo}></video>
              <div className="absolute bottom-0 left-2">
                <p>{peerName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="flex h-16 justify-center items-center space-x-2">
        {/* Camera */}
        {isVideoOn ? (
          <button
            className="flex flex-col w-16 h-full justify-center items-center text-white"
            onClick={() => {
              Handle_Cam();
            }}
          >
            <BsCameraVideoFill className="p-1" size={30} />
            <p className="p-1 text-xs">Turn Off</p>
          </button>
        ) : (
          <button
            className="flex flex-col w-16 h-full justify-center items-center text-white"
            onClick={() => {
              Handle_Cam();
            }}
          >
            <BsCameraVideoOffFill className="p-1" size={30} />
            <p className="p-1 text-xs">Turn On</p>
          </button>
        )}

        {/* Mic */}
        {isMicOn ? (
          <button
            className="flex flex-col w-16 h-full justify-center items-center text-white"
            onClick={() => {
              Handle_Mic();
            }}
          >
            <BsMicFill className="p-1" size={30} />
            <p className="p-1 text-xs">Mute</p>
          </button>
        ) : (
          <button
            className="flex flex-col w-16 h-full justify-center items-center text-white"
            onClick={() => {
              Handle_Mic();
            }}
          >
            <BsMicMuteFill className="p-1" size={30} />
            <p className="p-1 text-xs">Unmute</p>
          </button>
        )}

        {/* Leave */}
        <button
          className="flex flex-col w-16 h-full justify-center items-center text-white hover:text-red-500 transition duration-500"
          onClick={() => {
            LeaveRoom();
          }}
        >
          <BsTelephoneXFill className="p-1" size={30} />
          <p className="p-1 text-xs">Leave</p>
        </button>
      </div>
    </div>
  );
}
