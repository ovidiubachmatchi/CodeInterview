module.exports.updateDiv = () => {
  // Set up a WebRTC connection
  const connection = new RTCPeerConnection();

  // Set up a channel for sending data
  const sendChannel = connection.createDataChannel("sendChannel");

  // Set up a handler to receive messages from other peers
  connection.onmessage = (event) => {
    console.log(`Received message: ${event.data}`);
  }

  // Set up a signaling channel to exchange offer and answer messages
  const signalingChannel = new WebSocket("ws://localhost:3001");

  // Set up a handler to handle errors and disconnections
  signalingChannel.onerror = (error) => {
    console.error(`WebSocket error: ${error}`);
  }
  
  signalingChannel.onclose = (event) => {
    console.log(`WebSocket closed: ${event.code} ${event.reason}`);
  }

  // Send an offer message to the other peer
  signalingChannel.send(JSON.stringify({
    type: "offer",
    sdp: connection.createOffer().sdp
  }));

  // Set up a handler to receive answer messages from the other peer
  signalingChannel.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "answer") {
      connection.setRemoteDescription(new RTCSessionDescription(message.sdp));
    }
  }

  // Send a message to every other peer on the link
  sendChannel.send("Hello, everyone!");
}
