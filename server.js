'use strict';

var NedbPersistence = require('./persistence');
var Aedes = require('aedes');
var net = require('net');

var db = new NedbPersistence();
var aedes = Aedes({ persistence: db });
var server = net.createServer(aedes.handle);
var port = 1883;

server.listen(port, function () {
  console.log('server listening on port', port);
});
