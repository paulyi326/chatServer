var app = require('./app.js').app;
var http = require('./app.js').http;

var port = process.env.port || 8000;

http.listen(port, function(){
  console.log('listening on: ' + port);
});