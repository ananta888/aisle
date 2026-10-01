# 18 – Lokales TTS: Dragon-Voice-Runtime (Piper)

Optionale lokale Sprachausgabe über die `dragon-voice-runtime.py` (Piper,
CPU). Standard bleibt die Browser-Sprachausgabe (`WebSpeechOutput`).

Quelle: `3d-games/tools/dragon-voice-runtime.py`,
Konfiguration `3d-games/.local/dragon-voice.json`.

## HTTP-Vertrag

| Route | Auth | Body | Antwort |
|-------|------|------|---------|
| `GET /health` | nein | – | JSON-Status (`tts: piper`) |
| `POST /speak` | `Authorization: Bearer <token>` | JSON `{"text": "..."}` (≤ 280 Zeichen) | `audio/wav` (Piper, 16-bit PCM mono, 22050 Hz) |
| `POST /transcribe` | Bearer | Roh-Audio | JSON-Transkript (nicht unser Pfad) |

Fehler: `401 unauthorized`, `413 audio_too_large` (Body > 2 MB),
`422 invalid_audio_or_text` (leer/zu lang), `429 speech_busy`,
`503 speech_runtime_failed`.

Der Token liegt in `3d-games/.local/dragon-voice-token` (≥ 32 Zeichen).
**Niemals ins Repo committen** – nur lokal per Meta-Tag setzen.

## Adapter

- `app/src/adapters/dragon/dragon-voice-client.ts` – `POST /speak`,
  Bearer-Token, JSON-Text, liefert `ArrayBuffer` (WAV) oder `null` bei Fehler.
- `app/src/adapters/dragon/dragon-voice-output.ts` – implementiert den
  bestehenden `SpeechOutput`-Port: Dedup identischer Folgeansagen, `cancel()`
  stoppt Wiedergabe, veraltete Ansagen werden nach dem Fetch verworfen,
  Fehler über `onError`.
- `app/src/adapters/browser/web-audio-player.ts` – `AudioContext.decodeAudioData`
  + `AudioBufferSourceNode` (`AudioPlayer`-Port).

## Konfiguration in der App

`index.html` (leer = Browser-TTS):

```html
<meta name="aisle-tts-endpoint" content="http://127.0.0.1:18151" />
<meta name="aisle-tts-token" content="<lokal eintragen>" />
```

Die Runtime bindet an `172.19.0.1:18151` (WSL-intern). Läuft die PWA im
Windows-Browser, muss die von dort erreichbare Adresse eingetragen werden.

## Verhalten

Wie bei `WebSpeechOutput` gilt „latest wins": jede neue Ansage bricht die
vorherige ab. Das passt zur kontinuierlichen Führung und zur
Screenreader-Konfliktstrategie (Risiko A1 in `docs/09`).

## Verifikation

- Unit: `app/tests/dragon-voice.test.ts` (Request/Auth, Dedup, Cancel,
  Stale-Drop, Fehlerpfade).
- Live: `AISLE_TTS_URL=http://172.19.0.1:18151 AISLE_TTS_TOKEN=<token> npx vitest run tests/dragon-voice-live.test.ts`.
- Referenzlauf: „Etwas nach rechts." → 55 852 Byte, RIFF/WAVE PCM16 mono 22050 Hz;
  ohne Token HTTP 401.
- Grenzen: TTS läuft auf CPU (Piper), Text max. 280 Zeichen, ein Sprechvorgang
  zur Zeit (`tts_lock`).

## Datenschutz

Ausschließlich lokal, `Cache-Control: no-store`, keine Speicherung von Text
oder Audio.
