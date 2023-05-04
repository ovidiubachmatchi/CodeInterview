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
        // console.log("room:", messageData);
        if (type === "join") {
          ws.roomId = messageData.room;
          console.log("joined new client on room:", messageData.room);
          // check if the room exists and if it does not, create it
          if (!clientsInRoom.get(messageData.room)) {
            clientsInRoom.set(messageData.room, []);
          }
          if (clientsInRoom.get(messageData.room).length <= 2) {
            clientsInRoom.get(messageData.room).push(ws);
          }
          // if there are no other clients in the room, this client is the initiator
          if (clientsInRoom.get(messageData.room).length === 1) {
            console.log("first client in room, setting as initiator");
            ws.isInitiator = true;
          }
          // if there are two clients in the room, send an offer to the initiator
          if (clientsInRoom.get(messageData.room).length === 2) {
            console.log("two clients in room, sending offer");
            const initiator = clientsInRoom.get(messageData.room).find(client => client.isInitiator);
            if (initiator) {
              initiator.send(JSON.stringify({
                type: 'initiate_offer',
              }));
            }
          }
          // if (clientsInRoom.get(messageData.room).length === 2) {
          //   console.log("two clients in room, sending offer");
          //   clientsInRoom.get(messageData.room).forEach(client => {
          //     client.send(JSON.stringify({
          //       type: 'initiate_offer',
          //     }));
          //   });
          // }
          // if there are more than two clients in the room, send a message to the client
          if (clientsInRoom.get(messageData.room).length >= 3) {
            console.log("TOO MANY CLIENTS");
            ws.send(JSON.stringify({
              type: 'toomany'
            }));
            return;
          }

        } else if (type === 'offer') {
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

  ws.on('close', () => {
    // Remove the disconnected client from the room
    const roomClients = clientsInRoom.get(ws.roomId);
    if (roomClients) {
      clientsInRoom.set(ws.roomId, roomClients.filter(client => client !== ws));
      console.log(`Client disconnected from room ${ws.roomId}`);
    }

    // Reset the remaining client's isInitiator property
    if (ws.roomId && clientsInRoom.get(ws.roomId)) {
      const remainingClient = clientsInRoom.get(ws.roomId).find(client => client !== ws);
      if (remainingClient) {
        remainingClient.isInitiator = false;
        remainingClient.send(JSON.stringify({ type: 'wait_for_new_user' }));
      }
    }
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
