var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var api = require('./db/api.js');

var bodyParser = require('body-parser');

// takes data the client sends to server in post request
// and sets them as keys on the body property
// on the request
app.use(bodyParser.urlencoded({
    extended: true
}));

// enable CORS
var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, Accept, Origin, Referer, User-Agent, Content-Type, Authorization');
 
  // intercept OPTIONS method
  if (req.method === 'OPTIONS') {
    res.send(200);
  }
  else {
    next();
  }
};

app.configure(function() {
    app.use(allowCrossDomain);   // make sure this is is called before the router
    app.use(app.router);      // not entirely necessary--will be automatically called with the first .get()
});

// api.createDummyUser();

// for testing locally
app.get('/', function(req, res){
    // res.sendFile(__dirname + '/index.html');
    api.getMessages(req, res, io);

});

app.get('/getMessages', function(req, res) {
    api.getMessages(req, res, io);
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
        var userRoom = rooms[msg.to];

        // There has to be a check here for if userRoom === undefined
        // Then I probably want to create the room

        // If user is currently in their room
        if (Object.keys(userRoom).length === 1) {

            console.log('message was sent', msg.text)
            io.to(msg.to).emit('chat message', msg); 
        }

        // save messages to db regardless
        api.saveMessage(msg);


    });
});

module.exports.app = app;
module.exports.http = http;
