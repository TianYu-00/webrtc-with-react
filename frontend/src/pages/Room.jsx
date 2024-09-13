import React, { useEffect, useState, useRef } from "react";
import {
  BsCameraVideoFill,
  BsCameraVideoOffFill,
  BsMicFill,
  BsMicMuteFill,
  BsTelephoneXFill,
  BsGearFill,
} from "react-icons/bs";
import { useNavigate, useLocation, useParams } from "react-router-dom";

export default function Room({ socket }) {
  const navigate = useNavigate();
  let location = useLocation();

  // settings
  const [isHideSettings, setIsHideSettings] = useState(true);

  // Room info
  const { roomID } = useParams();

  // my info
  const [stream, setStream] = useState(null);
  const myVideo = useRef();
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [myName, setMyName] = useState("");

  // devices
  const [selectedCamera, setSelectedCamera] = useState("");
  const [selectedAudioInput, setSelectedAudioInput] = useState("");
  const [selectedAudioOutput, setSelectedAudioOutput] = useState("");

  // peer info
  const peerVideo = useRef();
  const [peerName, setPeerName] = useState("");

  useEffect(() => {
    const myAssignedName = location.state.name;
    setMyName(myAssignedName);
  }, []);

  useEffect(() => {
    const getMediaStream = async () => {
      try {
        const constraints = {
          video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true,
          audio: selectedAudioInput ? { deviceId: { exact: selectedAudioInput } } : true,
        };
        const currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(currentStream);
        myVideo.current.srcObject = currentStream;
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    getMediaStream();
  }, [selectedCamera, selectedAudioInput]);

  function LeaveRoom() {
    navigate(`/`);
    return;
  }

  function Handle_Cam() {
    setIsVideoOn(!isVideoOn);
    if (stream) {
      stream.getVideoTracks()[0].enabled = !isVideoOn;
    }
  }

  function Handle_Mic() {
    setIsMicOn(!isMicOn);
    if (stream) {
      stream.getAudioTracks()[0].enabled = !isMicOn;
    }
  }

  function Handle_Settings() {
    setIsHideSettings(!isHideSettings);
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
            <SettingsModal
              isSettingHidden={isHideSettings}
              setSelectedCamera={setSelectedCamera}
              setSelectedAudioInput={setSelectedAudioInput}
              setSelectedAudioOutput={setSelectedAudioOutput}
            />
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

        {/* Settings */}
        <button
          className="flex flex-col w-16 h-full justify-center items-center text-white"
          onClick={() => {
            Handle_Settings();
          }}
        >
          <BsGearFill className="p-1" size={30} />
          <p className="p-1 text-xs">Settings</p>
        </button>
      </div>
    </div>
  );
}

function SettingsModal({ isSettingHidden, setSelectedCamera, setSelectedAudioInput, setSelectedAudioOutput }) {
  const [cameraDevices, setCameraDevices] = useState([]);
  const [audioInputDevices, setAudioInputDevices] = useState([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState([]);

  useEffect(() => {
    if (isSettingHidden) return;

    async function fetchDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setCameraDevices(devices.filter((device) => device.kind === "videoinput"));
        setAudioInputDevices(devices.filter((device) => device.kind === "audioinput"));
        setAudioOutputDevices(devices.filter((device) => device.kind === "audiooutput"));
      } catch (error) {
        console.error("Error fetching devices:", error);
      }
    }

    fetchDevices();
  }, [isSettingHidden]);

  if (isSettingHidden) return null;

  return (
    <div className="absolute bottom-20 border z-10 w-fit p-2 rounded bg-zinc-800">
      <div className="text-left">
        <p>Camera</p>
        <select
          name="cameras"
          id="cameras"
          className="w-full border rounded p-2"
          onChange={(e) => setSelectedCamera(e.target.value)}
        >
          {cameraDevices.map((currentCamera) => (
            <option value={currentCamera.deviceId} key={currentCamera.deviceId}>
              {currentCamera.label}
            </option>
          ))}
        </select>
      </div>
      <div className="text-left">
        <p>Audio Input</p>
        <select
          name="audio-inputs"
          id="audio-inputs"
          className="w-full border rounded p-2"
          onChange={(e) => setSelectedAudioInput(e.target.value)}
        >
          {audioInputDevices.map((currentAudioInput) => (
            <option value={currentAudioInput.deviceId} key={currentAudioInput.deviceId}>
              {currentAudioInput.label}
            </option>
          ))}
        </select>
      </div>
      <div className="text-left">
        <p>Audio Output</p>
        <select
          name="audio-outputs"
          id="audio-outputs"
          className="w-full border rounded p-2"
          onChange={(e) => setSelectedAudioOutput(e.target.value)}
        >
          {audioOutputDevices.map((currentAudioOutput) => (
            <option value={currentAudioOutput.deviceId} key={currentAudioOutput.deviceId}>
              {currentAudioOutput.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
