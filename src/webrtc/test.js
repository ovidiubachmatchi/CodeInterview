module.exports.updateDiv = () => {
    let peerConnection;
    const servers = {
        iceServers:[
            {
                urls:['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
            }
        ]
    }
    const createOffer = async () => {
        console.log("script started")
        const pc = new RTCPeerConnection(servers);
        const channel = pc.createDataChannel("chat", {negotiated: true, id: 0});
        channel.onopen = (event) => {
          channel.send('Hi!');
        }
        channel.onmessage = (event) => {
          console.log(event.data);
        }
    }
    createOffer()
}
  