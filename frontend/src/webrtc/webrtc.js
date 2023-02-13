// in a separate JavaScript file
import App from '../components/App';

const servers = {
  iceServers:[
      {
          urls:['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
      }
  ]
}
let queryString = window.location.search
let urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get('room')

const ws = new WebSocket('ws://localhost:8080');

const RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
const pc = new RTCPeerConnection(servers)
let uid = String(Math.floor(Math.random() * 1000000))
console.log(uid);

let dataChannel = pc.createDataChannel(roomId, {negotiated: true, id: 0});

const sendMessage = (msg) => {
  dataChannel.send(msg);
}

const createConnection = async () => {  const servers = {
  iceServers:[
      {
          urls:['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
      }
  ]
}
let queryString = window.location.search
let urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get('room')
  if(!roomId) {
    if(!alert("No room id in url")) document.location = '/';
  }

  ws.onopen = function() {
    ws.send(JSON.stringify({ type: 'join', room: roomId }));
  }



  dataChannel.onclose = () => {
    console.log('Data channel closed');
  };

  dataChannel.onmessage = (event) => {
    // update the state
    
  };

  document.querySelector('.share').addEventListener('click', async function() {
    console.log('call button called');

    let offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    console.log('creating offer', offer);
    // send the offer to the other client through the signaling server
    ws.send(JSON.stringify({
      room: roomId,
      type: 'offer',
      offer: offer
    }));
    console.log('offer sended to ws');
  });

  ws.onmessage = async function(message) {
    // transform from text to json object
    // message: {
    // offer: {type: 'offer', sdp: 'v=0\r\no=- 7405937665467555657 2 IN IP4 127.0.0.1\r\ns…0 0\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\n'}
    // type: "offer"
    // }
    message = (JSON.parse(message.data));
    console.log("received from ws a raw message", message);

    if(message.type === 'toomany') {
      if(!alert("Already two people are connected")) document.location = '/';
    }

    if(message.type === 'offer') {
      message = JSON.parse( String.fromCharCode(...message.offer.data));
      console.log('offer received from ws', message);
      if (message.offer.sdp) {
        onOffer(message.offer)
      }
    }
    
    if (message.type === 'answer') {
      message = JSON.parse( String.fromCharCode(...message.answer.data));
      console.log('answer received from ws', message);
      addAnswer(message.answer)
    }
    
    if (message.type === 'candidate') {
        message = JSON.parse( String.fromCharCode(...message.candidate.data));
        console.log('candidate received from ws', message);
        pc.addIceCandidate(new RTCIceCandidate(message.candidate))
    }
  }

  const addAnswer = async (answer) => {
    if(!pc.currentRemoteDescription) {
      await pc.setRemoteDescription(answer)
    }
  }

  // listen for an answer from the other client
  pc.onanswer = async function(event) {
      console.log("onanswear");
      // set the remote description received from the other client
      await pc.setRemoteDescription(event.answer);
  };

  // listen for an offer from the other client
  const onOffer = async function(message) {
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

export {createConnection, sendMessage}