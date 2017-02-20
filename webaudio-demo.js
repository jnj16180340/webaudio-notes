const useMicrophone = false; // use mic input
const useOscillator = true; // use linear(time) frequency sweep sine wave
const useConstant = false; // use [c, c, c...]
const useMonotonic = false; // use sawtooth [-1...1] with period equal to buffer length
const useWebsocket = true; // send data to server

var audioContext;
audioContext = new AudioContext();

function myPCMFilterFunction(inputSample) {
  var noiseSample = Math.random() * 2 - 1;
  return inputSample + noiseSample * 0.1;  // For example, add noise samples.
}

var teeStreamNode;
if(useWebsocket){
  // is this in global scope...
  // WRONG LOCATION
  // should be defined in a node.
  var socket = new WebSocket('ws://localhost:8080');
  
  socket.addEventListener('open', function (event) {
    console.log('Connected to server!');
    //socket.send('Hello Server!');
  });
  
  //socket.addEventListener('message', function (event) {
  //  console.log('Message from server', event.data);
  //});
  
  var bufferSize = 4096;
  teeStreamNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
  teeStreamNode.onaudioprocess = function(e) {
    // this just ignores any extra channels... okay
    // does this node make webaudio downmix everything?
    var input = e.inputBuffer.getChannelData(0);
    var output = e.outputBuffer.getChannelData(0);
    // might need to copy to an intermediate typedarray before streaming out
    //output = input; // doesn't work, we need to copy values explicitly
    for (var i = 0; i < bufferSize; i++) {
      // Modify the input and send it to the output.
      output[i] = myPCMFilterFunction(input[i]);
    }
    socket.send(new Float32Array(input));
  }
  
}

// Create a pcm processing "node" for the filter graph, this is a dummy that adds a little bit of noise
var bufferSize = 4096;
var myPCMProcessingNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
myPCMProcessingNode.onaudioprocess = function(e) {
  // this just ignores any extra channels... okay
  var input = e.inputBuffer.getChannelData(0);
  var output = e.outputBuffer.getChannelData(0);
  for (var i = 0; i < bufferSize; i++) {
    // Modify the input and send it to the output.
    output[i] = myPCMFilterFunction(input[i]);
  }
}

var errorCallback = function(err){
  console.log(err.name + ": " + err.message);
}

/*
if(useMicrophone){
  var mediaConstraints = {audio: true}; 
  // new-style promise based getUserMedia
  navigator.mediaDevices.getUserMedia(mediaConstraints)
  .then(function(stream){
    // microphone -> myPCMProcessingNode -> destination.
    var microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(myPCMProcessingNode);
    // destination of audioContext is set automatically (in this case)
    myPCMProcessingNode.connect(audioContext.destination);
    //microphone.start(0);
  })
  .catch(errorCallback);
}
*/

if(useOscillator){
  // do crap
  var osc = audioContext.createOscillator();
  // we could replace this with new OscillatorNode(params)
  osc.type = 'sine';
  osc.frequency.value = 440;
  osc.detune = 0;
  // osc.setPeriodicWave(piff) // for wavetable synthesis
  
  //osc.connect(myPCMProcessingNode);
  //myPCMProcessingNode.connect(audioContext.destination);
  osc.connect(teeStreamNode);
  teeStreamNode.connect(audioContext.destination);
  
  // Frequency sweep 0...880Hz
  
  // WebAudio automation does not work inside setTimeout events
  //osc.frequency.linearRampToValueAtTime(880,2);
  
  // We can connect oscillator node TO A PARAMETER?!
  var lfo = audioContext.createOscillator();
  lfo.type='sawtooth';
  lfo.frequency.value = 0.2;
  // Oscillators go from -1 to 1; scale its output
  var lfoGain = audioContext.createGain();
  lfoGain.gain.value = 440;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  
  // ALL SOURCES MUST BE STARTED
  lfo.start(); // must be called
  osc.start(); // must be called
}

if(useMonotonic){
  throw new Error('monotonic sweep not implemented yet');
}

if(useConstant){
  throw new Error('constant audio not implemented yet');
}
