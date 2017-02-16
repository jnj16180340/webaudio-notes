const useMicrophone = false;
const useOscillator = true;

function myPCMFilterFunction(inputSample) {
  var noiseSample = Math.random() * 2 - 1;
  return inputSample + noiseSample * 0.1;  // For example, add noise samples.
}

var audioContext;
audioContext = new AudioContext();

// Create a pcm processing "node" for the filter graph.
var bufferSize = 4096;
var myPCMProcessingNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
myPCMProcessingNode.onaudioprocess = function(e) {
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
