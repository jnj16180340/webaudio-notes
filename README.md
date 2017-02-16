# webaudio-notes

### Google CloudSpeech
> Audio input can be captured by an application’s microphone or sent from a pre-recorded audio file. Multiple audio encodings are "supported," including FLAC, AMR, PCMU and Linear-16.

| Encoding | Support | Notes |
| --- | --- | --- |
| `ENCODING_UNSPECIFIED` | Not specified. Will return result google.rpc.Code.INVALID_ARGUMENT. |
| `LINEAR16` | Uncompressed 16-bit signed little-endian samples (Linear PCM). **This is the only encoding that may be used by `AsyncRecognize`.** | Can it be compressed by e.g. gzip? |
| `FLAC` | This is the recommended encoding for `SyncRecognize` and `StreamingRecognize` because it uses lossless compression. 16-bit and 24-bit samples are supported. Not all fields in STREAMINFO are supported. | **Clearly `AsyncRecognize` is not `StreamingRecognize`!** |
| `MULAW` | 8-bit samples that compand 14-bit audio samples using G.711 PCMU/mu-law. |  |
| `AMR` | Adaptive Multi-Rate Narrowband codec. sample_rate must be 8000 Hz. |  |
| `AMR_WB` | 	Adaptive Multi-Rate Wideband codec. sample_rate must be 16000 Hz. |  |
