const useMicrophone = false; // use mic input
const useOscillator = true; // use linear(time) frequency sweep sine wave
const useConstant = false; // use [c, c, c...]
const useMonotonic = false; // use sawtooth [-1...1] with period equal to buffer length
const useWebsocket = true; // send data to server

const bufferSize = 4096; // for ScriptProcessor nodes

var sources = []; // all the audio sources that will need to be start()-ed
var sourceNode; // microphone, oscillator, ...
var intermediateNode; // this is the node in the middle of the filter graph

// If this was in production, we would check for AudioContext support here
var audioContext;
audioContext = new AudioContext();

// noise function
function myPCMFilterFunction(inputSample){
  var noiseSample = Math.random() * 2 - 1;
  return inputSample + noiseSample * 0.1;  // For example, add noise samples.
}

// Create a pcm processing "node" for the filter graph, this is a dummy that adds a little bit of noise
let addNoiseNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
addNoiseNode.onaudioprocess = function(e){
  // this just ignores any extra channels... okay
  var input = e.inputBuffer.getChannelData(0);
  var output = e.outputBuffer.getChannelData(0);
  for (var i = 0; i < bufferSize; i++){
    // Modify the input and send it to the output.
    output[i] = myPCMFilterFunction(input[i]);
  }
}

if(useWebsocket){
  // connect to server
  var socket = new WebSocket('ws://localhost:8080');
  
  socket.addEventListener('open', function (event){
    console.log('Connected to server!');
    // This is where we could negotiate formats etc.
    //socket.send('Hello Server!');
  });
  
  //socket.addEventListener('message', function (event){
  //  console.log('Message from server', event.data);
  //});
  
  let teeStreamNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
  teeStreamNode.onaudioprocess = function(e){
    // this just ignores any extra channels... okay
    // does this node make webaudio downmix everything?
    var input = e.inputBuffer.getChannelData(0);
    var output = e.outputBuffer.getChannelData(0);
    // might need to copy to an intermediate typedarray before streaming out
    //output = input; // doesn't work, we need to copy values explicitly
    for (var i = 0; i < bufferSize; i++){
      // Modify the input and send it to the output.
      output[i] = myPCMFilterFunction(input[i]);
    }
    socket.send(new Float32Array(input));
  }
  intermediateNode = teeStreamNode;
} else{
  intermediateNode = addNoiseNode;
}

var errorCallback = function(err){
  console.log(err.name + ": " + err.message);
}


if(useMicrophone){
  let mediaConstraints = {audio: true}; 
  // new-style promise based getUserMedia
  navigator.mediaDevices.getUserMedia(mediaConstraints)
  .then(function(stream){
    // microphone -> addNoiseNode -> destination.
    let microphone = audioContext.createMediaStreamSource(stream);
    sourceNode = microphone;
    sources.push(sourceNode);
    //microphone.connect(intermediateNode);
    // destination of audioContext is set automatically (in this case)
    //intermediateNode.connect(audioContext.destination);
    //microphone.start();
  })
  .catch(errorCallback);
}


if(useOscillator){
  let osc = audioContext.createOscillator();
  // we could replace this with new OscillatorNode(params)
  osc.type = 'sine';
  osc.frequency.value = 440;
  osc.detune = 0;
  
  //osc.connect(intermediateNode);
  //intermediateNode.connect(audioContext.destination);
  
  // Frequency sweep 0...880Hz
  
  // WebAudio automation does not work inside setTimeout events
  //e.g. osc.frequency.linearRampToValueAtTime(880,2);
  
  // We can connect oscillator node TO A PARAMETER?!
  let lfo = audioContext.createOscillator();
  lfo.type='sawtooth';
  lfo.frequency.value = 0.2;
  // Oscillators go from -1 to 1; scale its output
  let lfoGain = audioContext.createGain();
  lfoGain.gain.value = 440;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  
  sourceNode = osc;
  
  sources.push(lfo);
  sources.push(sourceNode);
  
  // ALL SOURCES MUST BE STARTED
  //lfo.start(); // must be called
  //osc.start(); // must be called
}

if(useMonotonic){
  throw new Error('monotonic sweep not implemented yet');
}

if(useConstant){
  throw new Error('constant "audio" not implemented yet');
}

// Build the filter graph, start things, etc.
// We assume topology: Source -> ScriptProcessorNode -> Destination
sourceNode.connect(intermediateNode);
intermediateNode.connect(audioContext.destination);
for(i in sources){
  sources[i].start();
}
