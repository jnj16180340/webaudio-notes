# webaudio-notes

## WebAudio inspection

1. Record to disk using OfflineAudioContext
    - Simplest case??? (maybe not)
    - Accomplishes goals if we can also read from the file

2. Record to disk using separate stream processing server (Node, Elixir etc)
    - More similar to what CloudSpeech sees
    - Easier to send stuff to cloudspeech
    
3. MediaRecorder API
    - It's supported by Chrome and Firefox
    - SEE https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Using_the_MediaStream_Recording_API

Let's go with (2) for the sake of simple disk writes.

We can only interact with the WebAudio stream from a ScriptProcessorNode, which processes stuff in discrete (time-domain) chunks.

### General concerns

- Can't set sample rate of AudioContext. Any resampling should happen in an offline audio context.
- BUT, we can set sample rate of MICROPHONE using constraints. One way is to hook up a microphone with desired sample rate to the webaudio graph, set its gain to zero, and roll with it :)
- We **might** need to downmix stereo->mono with microphone input. It's probably easiest to do this within a ScriptProcessorNode, or on the writer side. **ChannelMerger does not necessarily output mono, be careful**
- Downmixing (should) also happen if we define a ScriptProcessorNode which only has one input channel :)

### Audio encoding

- We can play raw (headerless) audio with `sox`
- Use `play` instead of `sox -d` because it's easy to overwrite files!
- `play -r 44100 -e floating-point -b 32 -c 1 -t raw ./1487623877259`
- If we set 2 channels where there are really 1, it sounds octave-doubled.

- LPCM16 `WAV` files are just raw LPCM16 audio data prepended with a header. Add/strip this header as necessary.
    - Find out bitrate, sampling rate etc. of stream
    - Write WAV header
    - Write data...

- FLAC stream compression supports LPCM16 (FLAC does not support floats)
    - https://www.npmjs.com/package/emflac
    - https://github.com/Rillke/flac.js
    - Various libflac bindings if we're native...
    - (decoder only) https://www.npmjs.com/package/flac.js

### `ScriptProcessorNode`
- `AudioBuffer`
- `AudioBuffer.getChannelData()` returns a `Float32Array`
- Also has properties `sampleRate`, `length`/sample frames, `duration`/s, `numberOfChannels`

- Easiest TypedArray conversion is via e.g. Uint16Array.from(new Float32Array([values]). But this tries to preserve intended values, which is not what we want.
- Amplitude range of Float32 audio data is **[-1,1]**
- Map [-1,1] -> [0...65535]. Is WebAudio [-1,1] or [-1,1)?
- See http://jsperf.com/float32-to-int16/2

- Streaming over websockets: See http://blog.mgechev.com/2015/02/06/parsing-binary-protocol-data-javascript-typedarrays-blobs/
- https://www.npmjs.com/package/websocket-stream

    
### Google CloudSpeech
> Audio input can be captured by an application’s microphone or sent from a pre-recorded audio file. Multiple audio encodings are "supported," including FLAC, AMR, PCMU and Linear-16.
[See Google dox](https://cloud.google.com/speech/reference/rpc/google.cloud.speech.v1beta1#google.cloud.speech.v1beta1.RecognitionConfig.AudioEncoding)

| Encoding | Support | Notes |
| --- | --- | --- |
| `ENCODING_UNSPECIFIED` | Not specified. Will return result google.rpc.Code.INVALID_ARGUMENT. |
| `LINEAR16` | Uncompressed 16-bit signed little-endian samples (Linear PCM). **This is the only encoding that may be used by `AsyncRecognize`.** | Can it be compressed by e.g. gzip? |
| `FLAC` | This is the recommended encoding for `SyncRecognize` and `StreamingRecognize` because it uses lossless compression. 16-bit and 24-bit samples are supported. Not all fields in STREAMINFO are supported. | **Clearly `AsyncRecognize` is not `StreamingRecognize`!** |
| `MULAW` | 8-bit samples that compand 14-bit audio samples using G.711 PCMU/mu-law. |  |
| `AMR` | Adaptive Multi-Rate Narrowband codec. sample_rate must be 8000 Hz. |  |
| `AMR_WB` | 	Adaptive Multi-Rate Wideband codec. sample_rate must be 16000 Hz. |  |

[SEE Encoding](https://cloud.google.com/speech/docs/encoding)
[SEE dox](https://cloud.google.com/speech/docs/)
`AsyncRecognize`: "Long running operation", probably most useful for offline transcription of long audio pieces (limited to 80', sync/stream limited to 1'). Pass b64 encoded raw audio data OR file stored in GoogleCloudStorage
`SyncRecognize`: Functionally similar to Async, but supports more encodings + less audio time
`StreamingRecognize`: Stream audio + receive streamed transcription. **This is the one we want.**
