# webaudio-notes

### Audio encoding

- LPCM16 `WAV` files are just raw LPCM16 audio data prepended with a header. Add/strip this header as necessary.

- FLAC stream compression supports LPCM16 (FLAC does not support floats)
    - https://www.npmjs.com/package/emflac
    - https://github.com/Rillke/flac.js
    - Various libflac bindings if we're native...
    - (decoder only) https://www.npmjs.com/package/flac.js

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
