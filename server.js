var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var port = process.env.port || 8000;


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('disconnect', function() {
    console.log('user disconnected');
  });

  socket.on('join', function(user) {
    socket.join(user.username);
    console.log(user.username + ' has joined');
  });

  socket.on('chat message', function(msg) {
    io.sockets.in(user.username).emit('chat message', user);
    // io.emit('chat message', msg);
  });
});

http.listen(port, function(){
  console.log('listening on: ' + port);
});