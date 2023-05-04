import React, { useState, useEffect, useRef } from "react";
import { IoMdSettings } from 'react-icons/io'
import BasicSelect from './BasicSelect.js'
import Editor from './Editor'
import "./App.css"
import getDefaultValue from '../languages/defaultCode'
// import {createConnection, sendMessage} from '../webrtc/webrtc.js'

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
    // send the offer to the other client through the signaling server
    ws.send(JSON.stringify({
      room: roomId,
      type: 'offer',
      offer: offer
    }));
  }
  console.log('offer sended to ws');
  // listen for an answer from the other client
  pc.onanswer = async function (event) {
    console.log("onanswear");
    // set the remote description received from the other client
    await pc.setRemoteDescription(event.answer);
  };
  pc.onconnectionstatechange = (event) => {
    console.log(`Connection state changed: ${pc.connectionState}`);
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


  const [language, setLanguage] = useState('Java')
  const [code, setCode] = useState()
  const isRemoteUpdate = useRef(false);
  const [isInitiator, setIsInitiator] = useState(false);

  // listen for an offer from the other client
  const onOffer = async function (message) {
    // set the remote description received from the other client
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(message));
      console.log("Remote description set:", message);

      // Process the candidates queue
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

    // if we received an offer, we need to answer
    if (pc.signalingState === "have-remote-offer" || pc.signalingState === "have-local-pranswer") {
      try {
        let answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log("Answer created and set:", answer);

        // send the answer to the other client through the signaling server
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
    // transform from text to json object
    // message: {
    // offer: {type: 'offer', sdp: 'v=0\r\no=- 7405937665467555657 2 IN IP4 127.0.0.1\r\ns…0 0\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\n'}
    // type: "offer"
    // }
    message = (JSON.parse(message.data));
    console.log("received from ws a raw message", message);

    if (message.type === 'toomany') {
      window.canJoin = 0;
      if (!alert("Already two people are connected")) document.location = '/';
    }

    if (message.type === 'initiate_offer') {
      setIsInitiator(true);
      // if (isInitiator) {
      createConnection();
      // }
    }

    if (message.type === 'wait_for_new_user') {
      console.log("User disconnected. Waiting for a new user to join.");
      // Perform any necessary cleanup, UI updates, or reset variables
      // setIsInitiator(false);
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
        // If the remote description is set, add the candidate
        try {
          await pc.addIceCandidate(candidate);
          console.log("ICE candidate added:", candidate);
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      } else {
        // If the remote description is not set yet, store the candidate in the queue
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

      // Add the tracks to the RTCPeerConnection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    } catch (err) {
      console.error('Error getting user media:', err);
    }
  };

  const candidatesQueue = [];

  // const onCandidate = async function (message) {
  //   const candidate = new RTCIceCandidate(message.candidate);
  //   if (pc.remoteDescription && pc.remoteDescription.type) {
  //     // If the remote description is set, add the candidate
  //     try {
  //       await pc.addIceCandidate(candidate);
  //       console.log("ICE candidate added:", candidate);
  //     } catch (error) {
  //       console.error("Error adding ICE candidate:", error);
  //     }
  //   } else {
  //     // If the remote description is not set yet, store the candidate in the queue
  //     candidatesQueue.push(candidate);
  //   }
  // };


  dataChannel.onmessage = (event) => {
    // update the state
    const receivedData = JSON.parse(event.data);
    console.log(receivedData);

    isRemoteUpdate.current = true;
    setCode(receivedData.code);
    setLanguage(receivedData.language);
  };

  useEffect(() => {
    setCode(getDefaultValue(language))
  }, [language])

  useEffect(() => {
    ws.onopen = function () {
      ws.send(JSON.stringify({ type: 'join', room: roomId }));
    };
  }, []);

  useEffect(() => {
    if (code !== undefined && !isRemoteUpdate.current) {
      if (dataChannel.readyState === "open") {
        let dataToBeSent = {
          code: code,
          language: language
        }
        dataChannel.send(JSON.stringify(dataToBeSent));
      }
    }
    isRemoteUpdate.current = false;
  }, [code, language]);


  return (
    <>
      <div className="app-root">
        <video id="localVideo" autoPlay muted style={{ position: 'absolute', right: 0, bottom: 0, width: 250, height: 250 }} />
        <video id="remoteVideo" autoPlay playsInline style={{ position: 'absolute', right: 250, bottom: 0, width: 250, height: 250 }} />
        <div className="top">
          <div className="top-left">
            <div className="editor-settings">
              <div className="settings"><IoMdSettings /></div>
              <div className="language">
                <BasicSelect
                  setLanguage={(lang) => setLanguage(lang)} />
              </div>
            </div>
            <div className="run"><p>Run</p></div>
          </div>
          <div className="top-right">
          </div>
        </div>
        <Editor
          code={code}
          language={language}
          setCode={(code) => {
            setCode(code);
          }}
        />
      </div>
    </>
  );
}

export default App;
