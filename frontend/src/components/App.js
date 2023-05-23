import React, { useState, useEffect, useRef } from "react";
import { TbAccessPoint, TbAccessPointOff } from "react-icons/tb";
import { TbPlayerPlay } from "react-icons/tb";
import { AiOutlineAudioMuted, AiOutlineAudio } from 'react-icons/ai'
import { BsCameraVideoOff, BsCameraVideo } from 'react-icons/bs'
import { RiArrowDropDownFill, RiArrowDropUpFill } from 'react-icons/ri'

import InputEditor from './InputEditor'
import OutputEditor from './OutputEditor'
import Editor from './Editor'
import TaskEditor from './TaskEditor.js'
import "./App.css"
import getDefaultValue from '../languages/defaultCode'

let queryString = window.location.search
let urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get('id')

const ws = new WebSocket('ws://localhost:8080/room?id=' + roomId);

const RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
    }
  ]
}
const pc = new RTCPeerConnection(servers)
const dataChannel = pc.createDataChannel(roomId, { negotiated: true, id: 0 });
let uid = String(Math.floor(Math.random() * 1000000))
console.log(uid);

async function getUserMediaStream() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    console.log("Local stream obtained:", stream);
    return stream;
  } catch (error) {
    console.error("Error accessing media devices.", error);
    return null;
  }
}

const createConnection = async () => {
  let queryString = window.location.search;
  let urlParams = new URLSearchParams(queryString);
  let roomId = urlParams.get('id');

  if (!roomId) {
    document.location = '/';
  }
  window.canJoin = 1
  ws.onopen = function () {
    ws.send(JSON.stringify({ type: 'join', room: roomId }));
  }

  const localStream = await getUserMediaStream();
  if (localStream) {
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });
    document.querySelector("#localVideo").srcObject = localStream;
  }



  dataChannel.onclose = () => {
    console.log('Data channel closed');
  };

  console.log('call button called');
  if (window.canJoin === 1) {
    let offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    console.log('creating offer', offer);
    ws.send(JSON.stringify({
      room: roomId,
      type: 'offer',
      offer: offer
    }));
  }
  console.log('offer sended to ws');
  pc.onanswer = async function (event) {
    console.log("onanswear");
    await pc.setRemoteDescription(event.answer);
  };

  pc.oniceconnectionstatechange = (event) => {
    console.log(`ICE connection state changed: ${pc.iceConnectionState}`);
  };

  pc.onicegatheringstatechange = (event) => {
    console.log(`ICE gathering state changed: ${pc.iceGatheringState}`);
  };


  pc.onicecandidate = async (event) => {
    console.log("Received ICE candidate event: ", event);
    if (event.candidate) {
      console.log("Sending new candidate: ", event.candidate);
      ws.send(JSON.stringify({
        room: roomId,
        type: 'candidate',
        candidate: event.candidate
      }));
    }
  };
}

function App() {
  ws.onopen = function () {
    ws.send(JSON.stringify({ type: 'join', room: roomId }));
  };

  const [showVideoContainer, setShowVideoContainer] = useState(false)

  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);

  const [remoteChanges, setRemoteChanges] = useState(false)
  const [language, setLanguage] = useState('java')
  const [code, setCode] = useState()
  const [task, setTask] = useState('please input the problem here')
  const [outputText, setOutputText] = useState();

  const isRemoteUpdate = useRef(false);
  const [isInitiator, setIsInitiator] = useState(false);
  const [inputText, setInputText] = useState("");
  const [selected, setSelected] = useState("Task");
  const [connected, setConnected] = useState(false);

  const onOffer = async function (message) {
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(message));
      console.log("Remote description set:", message);

      while (candidatesQueue.length) {
        const candidate = candidatesQueue.shift();
        try {
          await pc.addIceCandidate(candidate);
          console.log("ICE candidate added from queue:", candidate);
        } catch (error) {
          console.error("Error adding ICE candidate from queue:", error);
        }
      }

    } catch (error) {
      console.error("Error setting remote description:", error);
    }

    if (pc.signalingState === "have-remote-offer" || pc.signalingState === "have-local-pranswer") {
      try {
        let answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log("Answer created and set:", answer);

        ws.send(JSON.stringify({
          room: roomId,
          type: 'answer',
          answer: answer
        }));
      } catch (error) {
        console.error("Error creating or setting answer:", error);
      }
    }
  };



  const addAnswer = async (answer) => {
    if (!pc.currentRemoteDescription) {
      await pc.setRemoteDescription(answer)
    }
  }

  ws.onmessage = async function (message) {
    message = (JSON.parse(message.data));
    console.log("received from ws a raw message", message);

    if (message.type === 'toomany') {
      window.canJoin = 0;
      if (!alert("Already two people are connected")) document.location = '/';
    }

    if (message.type === 'initiate_offer') {
      setIsInitiator(true);
      createConnection();
      console.log("Initiating offer as initiator");
    }

    if (message.type === 'wait_for_new_user') {
      console.log("User disconnected. Waiting for a new user to join.");
      setConnected(false);
    }

    if (message.type === 'offer') {
      message = JSON.parse(String.fromCharCode(...message.offer.data));
      console.log('offer received from ws', message);
      if (message.offer.sdp) {
        onOffer(message.offer)
      }
    }

    if (message.type === 'answer') {
      message = JSON.parse(String.fromCharCode(...message.answer.data));
      console.log('answer received from ws', message);
      addAnswer(message.answer)
    }

    if (message.type === 'candidate') {
      message = JSON.parse(String.fromCharCode(...message.candidate.data));
      console.log('candidate received from ws', message);

      const candidate = new RTCIceCandidate(message.candidate);
      if (pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(candidate);
          console.log("ICE candidate added:", candidate);
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      } else {
        candidatesQueue.push(candidate);
      }
    }
  }

  pc.ontrack = (event) => {
    const remoteVideo = document.getElementById('remoteVideo');
    console.log('Remote track added:', event.streams[0]);
    if (event.streams && event.streams[0]) {
      remoteVideo.srcObject = event.streams[0];
    } else {
      if (!remoteVideo.srcObject) {
        remoteVideo.srcObject = new MediaStream();
      }
      remoteVideo.srcObject.addTrack(event.track);
    }
  };


  useEffect(() => {
    getUserMediaAndSetLocalVideo();
  }, []);

  const getUserMediaAndSetLocalVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const localVideo = document.getElementById('localVideo');
      localVideo.srcObject = stream;

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    } catch (err) {
      console.error('Error getting user media:', err);
    }
  };

  const candidatesQueue = [];

  dataChannel.onmessage = (event) => {
    const receivedData = JSON.parse(event.data);
    console.log(receivedData);

    isRemoteUpdate.current = true;
    if (receivedData.code !== undefined) {
      setCode(receivedData.code);
    }
    if (receivedData.language !== undefined) {
      setLanguage(receivedData.language);
    };
    if (receivedData.task !== undefined) {
      setTask(receivedData.task);
    }
    if (receivedData.inputText !== undefined) {
      setInputText(receivedData.inputText);
    }
    if (receivedData.outputText !== undefined) {
      setOutputText(receivedData.outputText);
    }
  }

  useEffect(() => {
    setRemoteChanges(false);
    setCode(getDefaultValue(language))
  }, [language])


  useEffect(() => {
    if (remoteChanges !== false && code !== undefined && !isRemoteUpdate.current) {
      if (dataChannel.readyState === "open") {
        let dataToBeSent = {
          code: code
        }
        dataChannel.send(JSON.stringify(dataToBeSent));
      }
    }
    setRemoteChanges(true);
    isRemoteUpdate.current = false;
  }, [code]);

  useEffect(() => {
    if (!isRemoteUpdate.current) {
      if (dataChannel.readyState === "open") {
        let dataToBeSent = {
          language: language
        }
        dataChannel.send(JSON.stringify(dataToBeSent));
      }
    }
    isRemoteUpdate.current = false;
  }, [language]);

  useEffect(() => {
    if (!isRemoteUpdate.current) {
      if (dataChannel.readyState === "open") {
        let dataToBeSent = {
          inputText: inputText
        }
        dataChannel.send(JSON.stringify(dataToBeSent));
      }
    }
    isRemoteUpdate.current = false;
  }, [inputText]);

  useEffect(() => {
    if (!isRemoteUpdate.current) {
      if (dataChannel.readyState === "open") {
        let dataToBeSent = {
          outputText: outputText
        }
        dataChannel.send(JSON.stringify(dataToBeSent));
      }
    }
    isRemoteUpdate.current = false;
  }, [outputText]);

  useEffect(() => {
    if (!isRemoteUpdate.current) {
      if (dataChannel.readyState === "open") {
        let dataToBeSent = {
          task: task
        }
        dataChannel.send(JSON.stringify(dataToBeSent));
      }
    }
    isRemoteUpdate.current = false;
  }, [task]);

  const toggleVideoContainer = () => {
    const chatContainer = document.querySelector('.chat-container');
    const videoContainer = document.getElementById('video-container');

    if (!showVideoContainer) {
      chatContainer.classList.add('expanded-chat-container');
      videoContainer.style.display = 'none';
    } else {
      chatContainer.classList.remove('expanded-chat-container');
      videoContainer.style.display = 'flex';
    }
    setShowVideoContainer(!showVideoContainer);
  };

  let _loadingFlag = true;
  let _timer;
  let _loadingStates = ["Loading...", "Loading..", "Loading.", "Loading.."];
  let _index = 0;

  function startLoadingAnimation() {
    if (!_loadingFlag) return;
    setOutputText(_loadingStates[_index]);
    _index = (_index + 1) % _loadingStates.length;
    _timer = setTimeout(startLoadingAnimation, 200);
  }

  function stopLoadingAnimation() {
    _loadingFlag = false;
    clearTimeout(_timer);
  }

  const runCode = async () => {
    setSelected("Output");
    startLoadingAnimation();

    const languages = {
      "java": 91,
      "python": 92,
      "javascript": 93,
      "cpp": 76,
    }

    const data = JSON.stringify({
      language_id: languages[language],
      source_code: btoa(code),
      stdin: btoa(inputText)
    });

    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener('readystatechange', function () {
      if (this.readyState === this.DONE) {
        if (this.status === 200 || this.status === 201) {
          let jsonObject = JSON.parse(this.responseText);
          let token = jsonObject.token;

          const data = null;

          const xhrGet = new XMLHttpRequest();
          xhrGet.withCredentials = true;

          xhrGet.addEventListener('readystatechange', function () {
            if (this.readyState === this.DONE) {
              stopLoadingAnimation();
              if (this.status === 200) {
                let jsonObject = JSON.parse(this.responseText);
                if (jsonObject.stdout == null)
                  setOutputText(atob(jsonObject.compile_output));
                else
                  setOutputText(atob(jsonObject.stdout));
              } else {
                console.error('GET request failed with status:', this.status);
              }
            }
          });

          xhrGet.addEventListener('error', function () {
            console.error('GET request encountered an error');
          });

          xhrGet.open('GET', `/submissions/${token}?base64_encoded=true&fields=*`);
          xhrGet.setRequestHeader('X-RapidAPI-Key', process.env.REACT_APP_XRAPIDAPYKEY);
          xhrGet.setRequestHeader('X-RapidAPI-Host', 'judge0-ce.p.rapidapi.com');

          xhrGet.send(data);
        } else {
          if (this.status === 429) {
            setOutputText("The code compilation service has exceeded its daily usage limit. Please try again later or contact the support team for further assistance.")
          }
          console.error('POST request failed with status:', this.status);
          console.log(this);
        }
      }
    });

    xhr.addEventListener('error', function () {
      console.error('POST request encountered an error');
    });

    xhr.open('POST', '/submissions?base64_encoded=true&fields=*');
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.setRequestHeader('X-RapidAPI-Key', process.env.REACT_APP_XRAPIDAPYKEY);
    xhr.setRequestHeader('X-RapidAPI-Host', 'judge0-ce.p.rapidapi.com');

    xhr.send(data);
  }

  const toggleAudio = () => {
    const localVideo = document.getElementById('localVideo');
    if (localVideo.srcObject) {
      localVideo.srcObject.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setAudioMuted(!audioMuted);
    }
  };

  const toggleVideo = () => {
    const localVideo = document.getElementById('localVideo');
    if (localVideo.srcObject) {
      localVideo.srcObject.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setVideoMuted(!videoMuted);
    }
  };

  const handleClick = (option) => {
    setSelected(option);
  };


  pc.onconnectionstatechange = (event) => {
    console.log(`Connection state changed: ${pc.connectionState}`);
    if (pc.connectionState == "connected")
      setConnected(true);
    else
      setConnected(false);
  };

  return (
    <>
      <div className="app-root">
        <div className="top">
          <div className="top-left">
            <div className="editor-settings">
              <div className={connected === true ? "settings green" : "settings gray"}>
                {connected ? (
                  <TbAccessPoint title="Connected" />
                ) : (
                  <TbAccessPointOff title="Not connected" />
                )}

              </div>
              <div className="language">
                <select
                  value={language}
                  onChange={changeSelectedLanguage}
                >
                  <option value="java">Java</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
            </div>
            <div className="run-code" title="Run code" onClick={runCode}><TbPlayerPlay /></div>
          </div>
          <div className="top-right">

            <div
              className={`option ${selected === "Task" ? "state" : ""}`}
              onClick={() => handleClick("Task")}
            >
              <p>Task</p>
            </div>
            <div
              className={`option ${selected === "Input" ? "state" : ""}`}
              onClick={() => handleClick("Input")}
            >
              <p>Input</p>
            </div>
            <div
              className={`option ${selected === "Output" ? "state" : ""}`}
              onClick={() => handleClick("Output")}
            >
              <p>Output</p>
            </div>
          </div>
        </div>
        <div className="bottom">

          <Editor
            code={code}
            language={language}
            setCode={(code) => {
              setCode(code);
            }}
          />
          <div className="container">
            <div className="chat-container">
              <TaskEditor
                text={task}
                setText={(text) => {
                  setTask(text);
                }}
                readOnly={isInitiator}
                className={selected !== "Task" ? "hidden" : ""}
              />

              <InputEditor
                text={inputText}
                setText={(text) => {
                  setInputText(text);
                }}
                className={selected !== "Input" ? "hidden" : ""}
              />

              <OutputEditor
                text={outputText}
                setText={(text) => {
                  setOutputText(text);
                }}
                className={selected !== "Output" ? "hidden" : ""}
              />
            </div>
            <div className="video-wrapper">
              <div className="video-controller">
                <p>Chat Window</p>
                {showVideoContainer ? (
                  <RiArrowDropUpFill fontSize="1.5em" onClick={toggleVideoContainer} />
                ) : (
                  <RiArrowDropDownFill fontSize="1.5em" onClick={toggleVideoContainer} />
                )}
              </div>

              <div id="video-container">
                <video id="remoteVideo" autoPlay playsInline />
                <div className="controller">
                  {audioMuted ? (
                    <AiOutlineAudioMuted
                      color="#f88888"
                      fontSize="1.5em"
                      onClick={toggleAudio}
                    />
                  ) : (
                    <AiOutlineAudio
                      color="white"
                      fontSize="1.5em"
                      onClick={toggleAudio}
                    />
                  )}
                  {videoMuted ? (
                    <BsCameraVideoOff
                      color="#f88888"
                      fontSize="1.5em"
                      onClick={toggleVideo}
                    />
                  ) : (
                    <BsCameraVideo
                      color="white"
                      fontSize="1.5em"
                      onClick={toggleVideo}
                    />
                  )}

                </div>
                <video id="localVideo" autoPlay muted />
              </div>
            </div>
          </div>
        </div>
      </div >
    </>
  );

  function changeSelectedLanguage(e) {
    setLanguage(e.target.value);
    console.log(e.target.value);
  }
}

export default App;
