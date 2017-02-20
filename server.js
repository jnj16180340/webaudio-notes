'use strict';

// server: consumes binary stream and writes it to a file.

const WebSocket = require('ws');
const fs = require('fs'); // don't really need to import this tho...
const exec = require('child_process').exec;

// use websocket compression "ONLY if REALLY needed", overhead in memory+performance
const wss = new WebSocket.Server({
  perMessageDeflate: false,
  port: 8080
});

wss.on('connection', function connection(ws) {
  // If we wanted to communicate audio info (channels, bitrate etc) we would do it here
  // For now, we assume 44.1kHz/float32/mono
  // Realistically, only sample rate may change unexpectedly
  // because sample rate is automatically set by client based on *everything*
  // however client may query sample rate and send it.
  console.log('New connection');
  let filenamebase = Date.now().toString();
  let filename = `${filenamebase}.raw`; // ms timestamp
  
  // Character encoding is important. fs defaults to utf-8
  let outstream = fs.createWriteStream(filename, {flags:'w'});
  
  outstream.on('open', function(){
    console.log(`Opened file ${filename}`);
  })
  outstream.on('close', function(){
    console.log(`Closed file ${filename}`);
  })
  
  ws.on('message', function incoming(message){
    //console.log('received: %s', message);
    outstream.write(message);
  });
  
  ws.on('close', function close(){
    console.log('Closed connection!');
    // WAV header is written here, because it contains total length
    outstream.end(); // this flushes buffer before closing file
    
    // WAV conversion is just for convenience.
    let conversion_command = `sox -r 44100 -e floating-point -b 32 -c 1 -t raw ${filename} ${filenamebase}.wav`;
    exec(conversion_command, function(err, stdout, stderr){
      console.log('Converting RAW to WAV');
      if (err) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
    })
  })
  //setInterval(function(){ws.send('ping!')},2000)
});

// On client:
/*
 var socket = new WebSocket('ws://localhost:8080');
 
 // Connection opened
 socket.addEventListener('open', function (event) {
 socket.send('Hello Server!');
 });
 
 // Listen for messages
 socket.addEventListener('message', function (event) {
 console.log('Message from server', event.data);
 });
 
 // send binary data
 // these are both written as expected
 socket.send(new Float32Array([1,2,3,4,5,6,7,8,9,10]))
 socket.send(new Uint8Array([1,2,3,4,5,6,7,8,9,10]))
 socket.send(new Int8Array([1,2,3,4,5,6,7,8,9,10]))
*/
