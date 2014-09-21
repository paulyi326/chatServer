var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var port = process.env.port || 8000;

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('disconnect', function() {
    console.log('user disconnected');
  });

  socket.on('join', function(user) {
    socket.join(user);
    console.log(user + ' has joined');
    console.log("all rooms", io.sockets.adapter.rooms);
  });

  socket.on('chat message', function(msg) {
    // hash containing all the rooms
    var rooms = io.sockets.adapter.rooms;

    /* PROBLEM I NEED TO CONSIDER:
        what happens when server restarts and i send a message
        to someone who hasn't joined a room since the server went down.
        Then I'd be sending a message to a room that is undefined

        Maybe create the room, and add it to messages property. Then when
        the other user joins, he'll just join the room that was created?
    */
    // So, because of reason in above comment, this could be undefined
    console.log('msg obj', msg);
    var userRoom = rooms[msg.to];
    console.log('userRoom', userRoom);
    // If user is currently in their room, this is hideous but it's cuz socket.io
    // is using arrays as if they were objects and it's super annoying.
    // I need to come up with a better way to express this
    if ((Object.keys(userRoom).length === 1 && userRoom.messages === undefined) || 
            Object.keys(userRoom).length === 2) {
        console.log('message was sent', msg.text)
        io.to(msg.to).emit('chat message', msg); 
    } else {
        // if user's msg's array exists, push msg to it. Else, create the array and add msg
        userRoom.messages ? userRoom.messages.push(msg) : userRoom.messages = [msg];
        console.log('message backlog', userRoom.messages)
    }
  });
});

http.listen(port, function(){
  console.log('listening on: ' + port);
});