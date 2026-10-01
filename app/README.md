# A.I.S.L.E. app (MVP)

Closed perception-guidance loop: spoken product request → live camera →
target detection → relative position → spoken guidance.

See [`../docs/15-mvp-priority.md`](../docs/15-mvp-priority.md) for the
authoritative scope and [`../todos/active/`](../todos/active/) for the tracks.

## Requirements

- Node.js 20+ (tested with v20.18.0)

## Commands

```sh
npm install
npm run test        # 49 unit + integration tests (deterministic, no hardware)
npm run typecheck   # strict TypeScript
npm run dev         # local dev server (browser adapters: mic, camera, TTS)
npm run build       # production build
```

## Architecture (hexagonal)

```
src/domain/         value objects: Confidence, TargetProduct, ProductCandidate, TrackState
src/ports/          interfaces: SpeechInput, SpeechOutput, CameraSource, TargetProductDetector
src/application/    loop logic: product-request, tracking, guidance rules,
                    state machine, safety supervisor, orchestrator
src/adapters/
  dummy/            deterministic adapters for tests (no hardware/network)
  browser/          Web Speech (STT/TTS), getUserMedia camera, WAV recorder
  jev/              llama.cpp-vision-decision /v1/decision (Jev mode, default vision)
  whisper/          whisper.cpp-audio-decision /v1/audio/decisions (local STT)
  dragon/           dragon-voice /speak (local Piper TTS)
  remote/           generic JSON VLM detector (fallback contract)
```

## Speech output: local TTS (optional)

Set `<meta name="aisle-tts-endpoint" content="http://127.0.0.1:18151">` and
`<meta name="aisle-tts-token" content="...">` to use `DragonVoiceOutput`
(local Piper WAV); otherwise browser `speechSynthesis` is used. The token is
local-only and must not be committed. See
[`../docs/18-local-tts-dragon-voice.md`](../docs/18-local-tts-dragon-voice.md).

## Speech provider: whisper.cpp-audio-decision

Set `<meta name="aisle-whisper-endpoint" content="http://127.0.0.1:18160">` to
use `WhisperDecisionSpeechInput` (keyword intent + transcription fallback),
otherwise Web Speech is used. See
[`../docs/17-whisper-decision-speech.md`](../docs/17-whisper-decision-speech.md).

The domain and application layers never depend on a concrete provider; every
model/camera/speech source is an adapter behind a port. The default vision
adapter is a **replaceable remote VLM**; barcode/OCR/detection adapters plug in
later without touching domain code.

## Vision provider: llama.cpp-vision-decision (Jev mode)

The default adapter (`src/adapters/jev/`) calls `POST <baseUrl>/v1/decision`
with `mode: "tree"`, `return_probs: true` and four typed fields
(`detected`, `horizontal`, `vertical`, `size`). The response carries a
per-field probability and an optional `abstain` flag, which map to
`Observation.confidence` and the safety uncertainty paths.

Configure the endpoint in `index.html`:

```html
<meta name="aisle-decision-endpoint" content="http://127.0.0.1:18150" />
```

The server (fork `ananta888/llama.cpp-vision-decision`) supports CORS, so the
PWA may call it directly. See
[`../docs/16-vision-provider-jev.md`](../docs/16-vision-provider-jev.md).

A generic JSON adapter (`src/adapters/remote/`) remains behind the same port as
a fallback. In both cases malformed or missing responses become an **uncertain
non-detection** – never a fabricated result.

Live check against a running server:

```sh
AISLE_DECISION_URL=http://127.0.0.1:18150 AISLE_DECISION_IMAGE_B64=<png-base64> \
  npx vitest run tests/jev-live.test.ts
```

## Status

Code and deterministic tests are complete for the MVP loop. Real-device and
real-VLM validation is still pending, so the corresponding todos are
`validation`/`partial`, not `done`.
