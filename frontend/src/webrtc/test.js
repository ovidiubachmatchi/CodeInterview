module.exports.updateDiv = () => {
    const RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;

    // create a WebSocket connection to the signaling server
    const ws = new WebSocket('ws://localhost:8080');

    // create a new RTCPeerConnection
    const pc = new RTCPeerConnection();
    console.log("new rtc peer conection and websocket ")
    // send an offer message to the signaling server when the 'call' button is clicked
    // create an offer
    console.log("create call offer")
    pc.createOffer(function(offer) {
        // send the offer through the WebSocket
        ws.send(JSON.stringify({
        type: 'offer',
        offer: offer
        }));
    });

    // listen for incoming messages from the signaling server
    ws.onmessage = function(event) {
    // parse the message to determine the type of message received
    const messageData = JSON.parse(JSON.stringify(event.data));
    const type = messageData.type;
    console.log("on message")
    if (type === 'offer') {
        console.log("offer")
        // handle an offer message by creating an answer and sending it back to the signaling server
        pc.setRemoteDescription(new RTCSessionDescription(messageData.offer), function() {
        pc.createAnswer(function(answer) {
            pc.setLocalDescription(answer);
            ws.send(JSON.stringify({
            type: 'answer',
            answer: answer
            }));
        });
        });
    } else if (type === 'answer') {
        console.log("answear")
        // handle an answer message by setting the remote description
        pc.setRemoteDescription(new RTCSessionDescription(messageData.answer));
    } else if (type === 'candidate') {
        console.log("canditate")
        // handle a candidate message by adding the candidate to the RTCPeerConnection
        pc.addIceCandidate(new RTCIceCandidate(messageData.candidate));
    } else {
        console.log("handle other messages")
        // handle any other message type by displaying it in the chat window
        console.log(event.data);

    }
    };

    // send a message to the signaling server when the 'send' button is clicked
    document.querySelector('.send').addEventListener('click', function() {
    // get the message text from the input field
    let data = '{"some":"data"}';

    // send the message through the WebSocket
    ws.send(JSON.parse(JSON.stringify(data))
    );
    });

    // listen for ICE candidates and send them to the signaling server
    pc.onicecandidate = function(event) {
        console.log("ice canditqte")
    if (event.candidate) {
        ws.send(JSON.stringify({
        type: 'candidate',
        candidate: event.candidate
        }));
    }
    };

}

