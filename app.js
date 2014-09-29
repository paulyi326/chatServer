var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var api = require('./db/api.js');
var cors = require('cors');

// var bodyParser = require('body-parser');
// app.use(bodyParser.urlencoded({
//   extended: true
// }));

// takes data the client sends to server in post request
// and sets them as keys on the body property
// on the request

// for testing locally
// app.get('/', function(req, res){
//   res.sendFile(__dirname + '/index.html');
// });

app.get('/getMessages', cors(), function(req, res) {
  api.getMessages(req, res, io);
});

app.get('/getFriends', cors(), function(req, res) {
  api.getFriends(req, res);
});

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('disconnect', function() {
      console.log('user disconnected');
  });

  // creates a room that is unique to a user
  socket.on('join', function(userID) {
    socket.join(userID);
    console.log(userID + ' has joined');

    console.log('auto room', io.sockets.adapter.rooms[socket.id]);

    // delete the room that's auto-generated since we dont use it
    delete io.sockets.adapter.rooms[socket.id];

    var rooms = io.sockets.adapter.rooms;
    var userRoom = rooms[userID];
    console.log("all rooms", rooms);

  });

  socket.on('chat message', function(msg) {

    console.log('incoming message', msg);

    // hash containing all the rooms
    var rooms = io.sockets.adapter.rooms;

    /* PROBLEM I NEED TO CONSIDER:
        what happens when server restarts and i send a message
        to someone who hasn't joined a room since the server went down.
        Then I'd be sending a message to a room that is undefined

        Maybe create the room, and add it to messages property. Then when
        the other user joins, he'll just join the room that was created?
    */

    // create a room for user if it does not exist, due to reasons in above comment
    if (!rooms[msg.to]) {
      rooms[msg.to] = [];
    }

    // have to test this. even if i message someone who has not joined, 
    // there shouldn't be an error
    var userRoom = rooms[msg.to];

    // If user is currently in their room
    // the '>= 1' is because sometimes the same user is in the room twice 
    // but under different session ids. Idk why yet.
    if (Object.keys(userRoom).length >= 1) {

      console.log('message was sent', msg.text)
      io.to(msg.to).emit('chat message', msg); 
    }

    // save messages to db regardless
    api.saveMessage(msg);

    console.log('rooms after sending to someone who hasnt joined', rooms);
  });
});

module.exports.app = app;
module.exports.http = http;

