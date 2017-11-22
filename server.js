const express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

const search = require('./lib/search');
const Device = require('./lib/Device');

app.get('/*', express.static('static'));

io.on('connection', function(socket){
  console.log('a user connected');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

search((err, devicePaths) => {
  if (err) { throw err; }

  if (devicePaths.length < 1) {
    console.log('no devices connected');
    process.exit();
    return;
  }

  const device = new Device(devicePaths[0]);
  device
    .on('key', (id, value) => io.emit('key', id, value))
    .on('axis', (id, value) => io.emit('axis', id, value))
    .on('error', (err) => {
      console.error('error', err);
      process.exit();
    });
});
