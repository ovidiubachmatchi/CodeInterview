const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

// keep track of connected clients
const clientsInRoom = new Map();

wss.on('connection', function connection(ws, req) {
  // add the new client to the list of connected clients
  if (clientsInRoom.has(req.url.substring(7, req.url.length)) && clientsInRoom.get(req.url.substring(7, req.url.length)) == 1) {
    console.log("too many people");
    ws.close()
    return;
  }
  else
    // ws.close()
    ws.on('message', function incoming(message) {
      // parse the message to determine the type of message received
      const messageData = JSON.parse(message);
      const type = messageData.type;
      if (messageData.room != null) {
        console.log("room:", messageDataclear);
        if (type === "join") {
          console.log("joined new client on room:", messageData.room);
          if (!clientsInRoom.get(messageData.room)) {
            clientsInRoom.set(messageData.room, []);
          }
          if (clientsInRoom.get(messageData.room).length < 2) {
            clientsInRoom.get(messageData.room).push(ws);
          }
          else {
            ws.send(JSON.stringify({
              type: 'toomany'
            }))
          }

        }
        else if (type === 'offer') {
          // handle an offer message by sending it to all other clients
          console.log("🕊️  OFFER: got an offer")
          broadcast(
            ws,
            messageData.room,
            JSON.stringify({
              type: 'offer',
              offer: message
            })
          );
        } else if (type === 'answer') {
          console.log("answer")
          // handle an answer message by sending it to all other clients
          broadcast(
            ws,
            messageData.room,
            JSON.stringify({
              type: 'answer',
              answer: message
            })
          );
        } else if (type === 'candidate') {
          console.log("received a candidate")
          // handle a candidate message by sending it to all other clients
          broadcast(
            ws,
            messageData.room,
            JSON.stringify({
              type: 'candidate',
              candidate: message
            })
          );
        } else {
          console.log("any other message")
          // handle any other message type by broadcasting the message to all clients
          broadcast(
            ws,
            messageData.room,
            JSON.stringify({
              type: 'message',
              message: message
            })
          );
        }
      }
    });

  ws.on('close', function close() {

    // remove the client from the list of connected clients when it disconnects
    clientsInRoom.forEach((a) => {
      var index = a.indexOf(ws);
      if (index !== -1) {
        a.splice(index, 1);
        ws.close()
        console.log("client removed");
      }
      if (a.length === 0) {
        clientsInRoom.delete(a);
      }
    });
  });
});

function broadcast(senderId, room, message) {
  // Iterate over all clients in the room
  if (clientsInRoom.get(room) instanceof Array)
    clientsInRoom.get(room).forEach((currentValue) => {
      if (currentValue !== senderId)
        currentValue.send(message);
    });
}
