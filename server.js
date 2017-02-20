'use strict';

// server: consumes binary stream and writes it to a file.
// May write a wav header in the future or something

const WebSocket = require('ws');
const fs = require('fs'); // don't really need to import this tho...

// use websocket compression "ONLY if REALLY needed", overhead in memory+performance
const wss = new WebSocket.Server({
  perMessageDeflate: false,
  port: 8080
});

// Connect: Make new file
// Message: Write to file (ignore ordering for now!)
// Close: Flush + close file
wss.on('connection', function connection(ws) {
  console.log('New connection');
  let filename = `${Date.now().toString()}.raw`; // ms timestamp
  
  // Character encoding is important. fs defaults to utf-8
  let outstream = fs.createWriteStream(filename, {flags:'w'});
  // we could write a wav header here, or wait until the end
  // we could put writing defs, on message defs inside outstream.on('open', fn...) callback
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
    outstream.end(); // should flush buffer before closing file
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
