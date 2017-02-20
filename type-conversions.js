'use strict';

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

module.exports.F32toUI16 = F32toUI16;
module.exports.F32toUI16safe = F32toUI16safe;
module.exports.F32toI16 = F32toI16;
module.exports.F32toI16safe = F32toI16safe;
