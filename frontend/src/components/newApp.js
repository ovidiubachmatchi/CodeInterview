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
let uid = String(Math.floor(Math.random() * 1000000))
console.log(uid);

let dataChannel = pc.createDataChannel(roomId, { negotiated: true, id: 0 });
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

    const remoteStream = new MediaStream();
    const [language, setLanguage] = useState('Java')
    const [code, setCode] = useState()
    const isRemoteUpdate = useRef(false);
    const [isInitiator, setIsInitiator] = useState(false);

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
        pc.ontrack = (event) => {
            console.log("ontrack event:", event);

            event.streams[0].getTracks().forEach((track) => {
                if (document.getElementById('localVideo').srcObject === null) {
                    // add the stream to the local video element if it's the first stream received
                    document.getElementById('localVideo').srcObject = new MediaStream([track]);
                } else {
                    // add the stream to the remote stream object if the local video element already has a stream
                    remoteStream.addTrack(track);
                }
            });

            // update the remote video element to display the combined stream
            document.getElementById('remoteVideo').srcObject = remoteStream;
        };

        if (message.type === 'message') {
            message = JSON.parse(String.fromCharCode(...message.message.data));
            console.log("message data extracted: ", message);
            if (message.type === 'start_video_call') {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

                    stream.getTracks().forEach((track) => {
                        pc.addTrack(track, stream);
                    });

                    document.getElementById('localVideo').srcObject = stream;
                } catch (error) {
                    console.error("Error accessing media devices.", error);
                }
            }
        }
        console.log("received from ws a raw message", message);

        if (message.type === 'toomany') {
            window.canJoin = 0;
            if (!alert("Already two people are connected")) document.location = '/';
        }

        if (message.type === 'initiate_offer') {
            createConnection();
        }

        if (message.type === 'wait_for_new_user') {
            console.log("User disconnected. Waiting for a new user to join.");
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

    const startVideoCall = async () => {
        console.log("startVideoCall function called");
        try {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

                stream.getTracks().forEach((track) => {
                    pc.addTrack(track, stream);
                });

                document.getElementById('localVideo').srcObject = stream;

                // Adăugați această linie pentru a trimite un mesaj către celălalt utilizator pentru a-l notifica să inițieze un apel.
                ws.send(JSON.stringify({ room: roomId, type: 'start_video_call' }));
            } catch (error) {
                console.error("Error accessing media devices.", error);
            }

            pc.ontrack = (event) => {
                console.log("ontrack event:", event);

                event.streams[0].getTracks().forEach((track) => {
                    remoteStream.addTrack(track);
                });

                if (document.getElementById('localVideo').srcObject !== null) {
                    // add the stream to the remote video element if the local video element already has a stream
                    document.getElementById('remoteVideo').srcObject = remoteStream;
                } else {
                    // add the stream to the local video element if it's the first stream received
                    document.getElementById('localVideo').srcObject = remoteStream;
                }
            };
        } catch (error) {
            console.error("Error initializing PeerConnection:", error);
        }
    }

    pc.oniceconnectionstatechange = (event) => {
        console.log("ICE connection state changed:", pc.iceConnectionState);
    };

    pc.onsignalingstatechange = (event) => {
        console.log("Signaling state changed:", pc.signalingState);
    };

    pc.onnegotiationneeded = async (event) => {
        console.log("Negotiation needed:", event);

        try {
            // Create an offer
            const offer = await pc.createOffer();
            console.log("creating offer", offer);

            // Set the local description
            await pc.setLocalDescription(offer);
            console.log("local description set");

            // Send the offer to the remote peer using your signaling server
            ws.send(JSON.stringify({
                room: roomId,
                type: 'offer',
                offer: offer
            }));
        } catch (err) {
            console.error("Error in negotiation needed:", err);
        }
    };


    pc.onaddstream = (event) => {
        console.log("onaddstream event:", event);
    };

    pc.onremovestream = (event) => {
        console.log("onremovestream event:", event);
    };

    return (
        <>
            <div className="app-root">
                <video id="localVideo" autoPlay muted style={{ position: 'absolute', right: 0, bottom: 0, width: 250, height: 250 }} />
                <video id="remoteVideo" autoPlay style={{ position: 'absolute', right: 250, bottom: 0, width: 250, height: 250 }} />
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
                        <div className="button call" onClick={startVideoCall}>call</div>
                        <div className="button send">send</div>
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
