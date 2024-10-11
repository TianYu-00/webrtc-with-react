import React, { useEffect, useState } from "react";

export default function SettingsModal({
  isSettingHidden,
  setSelectedCamera,
  setSelectedAudioInput,
  setSelectedAudioOutput,
  selectedCamera,
  selectedAudioInput,
  selectedAudioOutput,
  roomID,
  myName,
  mySocketID,
  videoElementRefs,
}) {
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

  async function handleRemoteAudioOutputChange(deviceId) {
    for (const videoRef of videoElementRefs) {
      if (videoRef.current) {
        try {
          await videoRef.current.setSinkId(deviceId);
        } catch (error) {
          console.error("Error setting audio output:", error);
        }
      }
    }
  }

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
          value={selectedCamera}
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
          value={selectedAudioInput}
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
          onChange={(e) => {
            const selectedDeviceId = e.target.value;
            setSelectedAudioOutput(selectedDeviceId);
            handleRemoteAudioOutputChange(selectedDeviceId);
          }}
          value={selectedAudioOutput}
        >
          {audioOutputDevices.map((currentAudioOutput) => (
            <option value={currentAudioOutput.deviceId} key={currentAudioOutput.deviceId}>
              {currentAudioOutput.label}
            </option>
          ))}
        </select>
      </div>

      <div className="text-left">
        <p className="border-b mt-2">Room Info</p>
        <p>Room ID: {roomID}</p>
        <p>Local Name: {myName}</p>
        <p>Local Socket ID: {mySocketID}</p>
      </div>
    </div>
  );
}
