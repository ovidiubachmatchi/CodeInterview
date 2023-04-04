import React, { useState, useEffect } from "react";
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
let uid = String(Math.floor(Math.random() * 1000000))
console.log(uid);

let dataChannel = pc.createDataChannel(roomId, { negotiated: true, id: 0 });

const createConnection = async () => {
  let queryString = window.location.search
  let urlParams = new URLSearchParams(queryString)
  let roomId = urlParams.get('id')
  if (!roomId) {
    document.location = '/';
  }
  window.canJoin = 1
  ws.onopen = function () {
    ws.send(JSON.stringify({ type: 'join', room: roomId }));
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

  // listen for an offer from the other client
  const onOffer = async function (message) {
    // set the remote description received from the other client
    await pc.setRemoteDescription(
      new RTCSessionDescription(message),
      async () => {
        // if we received an offer, we need to answer
        if (pc.signalingState === "have-remote-offer" || pc.signalingState === "have-local-pranswer") {
          let answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          console.log('sending answer');
          // send the answer to the other client through the signaling server
          ws.send(JSON.stringify({
            room: roomId,
            type: 'answer',
            answer: answer
          }));
        }
      }
    );
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
      // if(!alert("Already two people are connected")) document.location = '/';
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
      pc.addIceCandidate(new RTCIceCandidate(message.candidate))
    }
  }

  dataChannel.onmessage = (event) => {
    // update the state
    setCode(event.data);
  };

  useEffect(() => {
    setCode(getDefaultValue(language))
  }, [language])

  useEffect(() => {
    createConnection()
  }, [])

  useEffect(() => {
    if (code !== undefined) {
      if (dataChannel.readyState === "open")
        dataChannel.send(code)
    }
  }, [code]);

  return (
    <>
      <div className="app-root">
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
            <div className="button share">Share</div>
            <div className="button call">call</div>
            <div className="button send">send</div>
          </div>
        </div>
        <Editor
          code={code}
          language={language}
          setCode={(code) => setCode(code)}
        />
      </div>
    </>
  );
}

export default App;
