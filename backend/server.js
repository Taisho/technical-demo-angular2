#!/usr/bin/env node
var WebSocketServer = require('websocket').server;
//var tradeApi = require("./cli/price-collector");
var http = require('http');
let port = 4202;

const stream = require('./end-points/stream');
const db = require('./database');
const filesystem = require('./filesystem');


filesystem.ensureExists(filesystem.appDir, function () {
    db.initDb(filesystem.appDir, filesystem.dataDir);
})


var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(port, function() {
    console.log((new Date()) + ' Server is listening on port '+port);
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
    //console.log(request);
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    let intervalH;


    switch(request.resource) {
        case '/stream':
            console.log("stream is: ", stream);
            stream.serve(request, connection);
            break;
        //case '/':
        
    }
});