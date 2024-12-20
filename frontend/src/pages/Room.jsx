import React, { useEffect, useState, useRef } from "react";
import {
  BsCameraVideoFill,
  BsCameraVideoOffFill,
  BsMicFill,
  BsMicMuteFill,
  BsTelephoneXFill,
  BsGearFill,
} from "react-icons/bs";
import { MdScreenShare, MdStopScreenShare } from "react-icons/md";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import SettingsModal from "../components/RoomSettingsModal";

export default function Room({ socket, mySocketID }) {
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
  const [isScreenShare, setIsScreenShare] = useState(false);

  // devices
  const [selectedCamera, setSelectedCamera] = useState("");
  const [selectedAudioInput, setSelectedAudioInput] = useState("");
  const [selectedAudioOutput, setSelectedAudioOutput] = useState("");

  // peer info
  const peerVideo = useRef();
  const [peerName, setPeerName] = useState("");

  const rtcPeerConnection = useRef(null);

  // pending
  const [isPeerReady, setIsPeerReady] = useState(false);
  const iceCandidateBuffer = useRef([]);

  useEffect(() => {
    const myAssignedName = location?.state?.name;

    if (!myAssignedName || !roomID) {
      console.log("redirecting to main page");
      navigate(`/`, { replace: true });
    } else {
      setMyName(myAssignedName);
    }
  }, [location.state]);

  useEffect(() => {
    if (!myName) return;

    const configuration = {
      iceServers: [{ urls: "stun:stun1.google.com:19302" }],
    };

    rtcPeerConnection.current = new RTCPeerConnection(configuration);

    rtcPeerConnection.current.oniceconnectionstatechange = () => {
      console.log("ICE Connection State Change:", rtcPeerConnection.current.iceConnectionState);
      if (rtcPeerConnection.current.iceConnectionState === "disconnected") {
        socket.emit("leave-room", { roomID: roomID });
        navigate(`/`);
      }
    };

    rtcPeerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { candidate: event.candidate });
      }
    };

    rtcPeerConnection.current.ontrack = (event) => {
      console.log("Received remote track:", event.track);
      const remoteStream = event.streams[0];

      if (peerVideo.current) {
        peerVideo.current.srcObject = remoteStream;
      }
    };

    return () => {};
  }, [myName]);

  useEffect(() => {
    if (!myName) return;

    const getMediaStream = async () => {
      try {
        const constraints = {
          video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true,
          audio: selectedAudioInput ? { deviceId: { exact: selectedAudioInput } } : true,
        };
        const currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(currentStream);
        myVideo.current.srcObject = currentStream;

        const existingSenders = rtcPeerConnection.current.getSenders();

        const streamVideoTrack = currentStream.getVideoTracks()[0];
        if (streamVideoTrack) {
          const videoSender = existingSenders.find((sender) => sender.track.kind === "video");
          if (videoSender) {
            videoSender.replaceTrack(streamVideoTrack);
          } else {
            rtcPeerConnection.current.addTrack(streamVideoTrack, currentStream);
          }
        }

        const streamAudioTrack = currentStream.getAudioTracks()[0];
        if (streamAudioTrack) {
          const audioSender = existingSenders.find((sender) => sender.track.kind === "audio");
          if (audioSender) {
            audioSender.replaceTrack(streamAudioTrack);
          } else {
            rtcPeerConnection.current.addTrack(streamAudioTrack, currentStream);
          }
        }

        const amIHost = location.state.isHost;
        if (amIHost) {
          socket.on("peer-is-ready", async ({ roomID }) => {
            console.log(`Peer is ready to accept in room ${roomID}`);
            setIsPeerReady(true);
            socket.emit("get-peers-user-name", { roomID });
          });
        }
        if (!amIHost) {
          socket.emit("peer-ready-to-accept", { roomID });
          socket.emit("get-peers-user-name", { roomID });
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    getMediaStream();

    return () => {
      if (location.state.isHost) {
        socket.off("peer-is-ready");
      }
    };
  }, [selectedCamera, selectedAudioInput, myName]);

  const processIceCandidates = async () => {
    for (const candidate of iceCandidateBuffer.current) {
      await rtcPeerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
    }
    iceCandidateBuffer.current.length = 0;
  };

  useEffect(() => {
    const initiateOffer = async () => {
      if (isPeerReady) {
        await createOffer();
      }
    };

    initiateOffer();
  }, [isPeerReady]);

  useEffect(() => {
    if (!myName) return;

    socket.on("offer", async ({ offer }) => {
      console.log("Received offer for room:", offer);
      try {
        await rtcPeerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));

        // create answer
        const answer = await rtcPeerConnection.current.createAnswer();
        await rtcPeerConnection.current.setLocalDescription(answer);

        // send answer back
        socket.emit("answer", { answer });
        console.log("Sending answer:", answer);

        // process buffered ICE candidates
        await processIceCandidates();
      } catch (error) {
        console.error("Error handling offer:", error);
      }
    });

    socket.on("answer", async ({ answer }) => {
      console.log("Received answer for room:", answer);
      try {
        await rtcPeerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        await processIceCandidates();
      } catch (error) {
        console.error("Error setting remote description for answer:", error);
      }
    });

    socket.on("ice-candidate", ({ candidate }) => {
      // console.log("Received candidate for room:", candidate);
      if (rtcPeerConnection.current.remoteDescription) {
        rtcPeerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        iceCandidateBuffer.current.push(candidate);
      }
    });

    socket.on("receive-peers-user-name", ({ name }) => {
      console.log("Peer name:", { name });
      setPeerName(name);
    });

    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("receive-peers-user-name");
    };
  }, [myName]);

  const createOffer = async () => {
    try {
      const offer = await rtcPeerConnection.current.createOffer();
      await rtcPeerConnection.current.setLocalDescription(offer);
      socket.emit("offer", { offer });
      console.log("Sending offer:", offer);
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  };

  useEffect(() => {
    socket.on("force-leave-room", (data) => {
      console.log(data.message);
      navigate(`/`);
    });

    return () => {
      socket.off("force-leave-room");
    };
  }, []);

  function LeaveRoom() {
    socket.emit("leave-room", { roomID: roomID });
    navigate(`/`);
  }

  const toggleMediaTrack = (trackType, isOn, stream) => {
    if (stream) {
      const track = trackType === "video" ? stream.getVideoTracks()[0] : stream.getAudioTracks()[0];
      if (track) {
        track.enabled = !isOn;
      }
    }
  };

  function Handle_Cam() {
    setIsVideoOn((prev) => {
      toggleMediaTrack("video", prev, stream);
      return !prev;
    });
  }

  function Handle_Mic() {
    setIsMicOn((prev) => {
      toggleMediaTrack("audio", prev, stream);
      return !prev;
    });
  }

  const startScreenShare = async () => {
    try {
      const displayMediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      myVideo.current.srcObject = displayMediaStream;

      const displayVideoTrack = displayMediaStream.getVideoTracks()[0];

      const existingSenders = rtcPeerConnection.current.getSenders();
      const videoSender = existingSenders.find((sender) => sender.track.kind === "video");

      if (videoSender) {
        await videoSender.replaceTrack(displayVideoTrack);
      } else {
        rtcPeerConnection.current.addTrack(displayVideoTrack, displayMediaStream);
      }

      setIsScreenShare(true);

      displayMediaStream.getTracks().forEach((track) => {
        // handle built in control stop screen sharing
        track.onended = () => {
          const originalVideoTrack = stream.getVideoTracks()[0];
          if (videoSender) {
            videoSender.replaceTrack(originalVideoTrack);
            myVideo.current.srcObject = stream;
          }
          setIsScreenShare(false);
        };
      });
    } catch (error) {
      console.error("Error starting screen share:", error);
    }
  };

  const stopScreenShare = () => {
    const displayMediaTracks = myVideo.current.srcObject?.getTracks();

    if (displayMediaTracks) {
      displayMediaTracks.forEach((track) => track.stop());
    }

    const originalVideoTrack = stream.getVideoTracks()[0];
    const existingSenders = rtcPeerConnection.current.getSenders();
    const videoSender = existingSenders.find((sender) => sender.track.kind === "video");

    if (videoSender) {
      videoSender.replaceTrack(originalVideoTrack);
    }

    myVideo.current.srcObject = stream;

    setIsScreenShare(false);
  };

  function Handle_ScreenShare() {
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia
    if (isScreenShare) {
      stopScreenShare();
    } else {
      startScreenShare();
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
              <video className="h-full " autoPlay ref={peerVideo}></video>
              <div className="absolute bottom-0 left-2">
                <p>{peerName}</p>
              </div>
            </div>
            <SettingsModal
              isSettingHidden={isHideSettings}
              setSelectedCamera={setSelectedCamera}
              setSelectedAudioInput={setSelectedAudioInput}
              setSelectedAudioOutput={setSelectedAudioOutput}
              selectedCamera={selectedCamera}
              selectedAudioInput={selectedAudioInput}
              selectedAudioOutput={selectedAudioOutput}
              roomID={roomID}
              myName={myName}
              mySocketID={mySocketID}
              videoElementRefs={[myVideo, peerVideo]}
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
            className="flex flex-col w-16 h-full justify-center items-center text-red-500"
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
            className="flex flex-col w-16 h-full justify-center items-center text-red-500"
            onClick={() => {
              Handle_Mic();
            }}
          >
            <BsMicMuteFill className="p-1" size={30} />
            <p className="p-1 text-xs">Unmute</p>
          </button>
        )}

        {/* Screen Share */}
        {isScreenShare ? (
          <button
            className="flex flex-col w-16 h-full justify-center items-center text-red-500"
            onClick={() => {
              Handle_ScreenShare();
            }}
          >
            <MdScreenShare className="" size={30} />
            <p className="p-1 text-xs">Stop</p>
          </button>
        ) : (
          <button
            className="flex flex-col w-16 h-full justify-center items-center text-white"
            onClick={() => {
              Handle_ScreenShare();
            }}
          >
            <MdStopScreenShare className="" size={30} />
            <p className="p-1 text-xs">Share</p>
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
