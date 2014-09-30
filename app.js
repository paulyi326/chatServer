var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var api = require('./db/api.js');
var cors = require('cors');

// app.get('/', function(req, res) {
//   res.sendFile(__dirname + '/index.html');
// });

app.get('/getMessages', cors(), function(req, res) {
  api.getMessages(req, res, io);
});

app.get('/getFriends', cors(), function(req, res) {
  api.login(req, res);
});

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('disconnect', function() {
      console.log('user disconnected');
  });

  // creates a room that is unique to a user
  socket.on('join', function(userID) {

    // then, create a room with the userID as the room name
    socket.join(userID);
    console.log(userID + ' has joined');

    console.log('auto room', io.sockets.adapter.rooms[socket.id]);

    var rooms = io.sockets.adapter.rooms;
    var userRoom = rooms[userID];
    console.log("all rooms", rooms);

  });

  socket.on('chat message', function(msg) {

    console.log('incoming message', msg);

    // hash containing all the rooms
    var rooms = io.sockets.adapter.rooms;

    // server goes down or restarts, and the user that is being messaged has
    // not joined since then, his room will be undefined, so we have to create it first
    if (!rooms[msg.to]) {
      rooms[msg.to] = [];
    }

    var userRoom = rooms[msg.to];

    // If user is currently in their room
    if (Object.keys(userRoom).length >= 1) {

      // send message to user before saving, for instant messaging
      console.log('message was sent', msg.text)
      io.to(msg.to).emit('chat message', msg); 
    }

    // save messages to db
    api.saveMessage(msg);

    console.log('rooms after sending message', rooms);
  });
});

module.exports.app = app;
module.exports.http = http;

