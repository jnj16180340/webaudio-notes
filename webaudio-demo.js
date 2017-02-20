const useMicrophone = false; // use mic input
const useOscillator = true; // use linear(time) frequency sweep sine wave
const useConstant = false; // use [c, c, c...]
const useMonotonic = false; // use sawtooth [-1...1] with period equal to buffer length

function myPCMFilterFunction(inputSample) {
  var noiseSample = Math.random() * 2 - 1;
  return inputSample + noiseSample * 0.1;  // For example, add noise samples.
}

var audioContext;
audioContext = new AudioContext();


// If the coimparison operation isn't slow, we could use the strategy of
// http://watson-developer-cloud.github.io/speech-javascript-sdk/master/speech-to-text_webaudio-l16-stream.js.html

// SEE http://jsperf.com/float32-to-int16/2
function F32toUI16(input){
  // scales [-1,1) to [0,65536)
  // f32 has 7 digits of precision; 0.99999999 == 1.0
  // This will wrap 1.0 to 0 (65536)
  let imax = input.length; // this could be hardcoded
  let output = new Uint16Array(imax) // this could be re-used
  for(let i=0; i<imax; i++){
    output[i] = Math.floor(32768*(input[i]+1))
  }
  return output;
}

function F32toUI16safe(input){
  // scales [-1,1] to [0,65535]
  // Won't wrap +1.0 to 0 (65536)
  let imax = input.length; // this could be hardcoded
  let output = new Uint16Array(imax) // this could be re-used
  for(let i=0; i<imax; i++){
    output[i] = Math.floor(32767.5*(input[i]+1))
  }
  return output;
}

function F32toI16(input){
  // scales [-1,1) to [-32768,32767)
  // f32 has 7 digits of precision; 0.99999999 == 1.0
  // This will wrap 1.0 to 0 (32768)
  let imax = input.length; // this could be hardcoded
  let output = new Int16Array(imax) // this could be re-used
  for(let i=0; i<imax; i++){
    output[i] = Math.floor(32768*(input[i]))
  }
  return output;
}

function F32toI16safe(input){
  // scales [-1,1] to [-32768,32767]
  // Won't wrap +1.0 to 0 (32768)
  let imax = input.length; // this could be hardcoded
  let output = new Int16Array(imax) // this could be re-used
  for(let i=0; i<imax; i++){
    output[i] = Math.floor(32767.5*(input[i]))
  }
  return output;
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

if(useOscillator){
  // do crap
  var osc = audioContext.createOscillator();
  // we could replace this with new OscillatorNode(params)
  osc.type = 'sine';
  osc.frequency.value = 440;
  osc.detune = 0;
  // osc.setPeriodicWave(piff) // for wavetable synthesis
  
  osc.connect(myPCMProcessingNode);
  // do connections have to be set up in order?
  myPCMProcessingNode.connect(audioContext.destination);
  
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
