# 17 – Speech-Provider: whisper.cpp-audio-decision

Neben dem Vision-Fork gibt es `ananta888/whisper.cpp-audio-decision`:
Whisper encodiert einen Audioclip **einmal** und beantwortet daraus mehrere
finite, typisierte Entscheidungsfelder – ohne vorher ein Transkript zu erzeugen
(`POST /v1/audio/decisions*`, API `audio.decision.v1`).

Referenz: `whisper.cpp-audio-decision/docs/audio-decision-api.md`,
`docs/audio-decision-capabilities.md`.

## Warum das für A.I.S.L.E. nützlich ist

- **Intent** („ich suche / stop / nochmal“) direkt und kalibriert entscheiden,
  statt zu transkribieren und danach zu matchen.
- **Abstain/Coverage** als eingebautes Out-of-Set-Signal → passt zu unserem
  Safety-/Confidence-Modell.
- **Transkriptions-Fallback** liefert zusätzlich den freien Text für die
  unscharfe Produktauflösung (unser bestehender `ProductResolver`).

## Wichtiger Betriebshinweis

Inline-Schemas sind **nie kalibriert** und haben **keine** Default-Schwellen.
Ohne `abstain` wird eine Produktphrase als „ok" gewertet, statt zu abstain.
Unser Adapter setzt deshalb immer `abstain.min_coverage`/`min_probability`
und `fallback: "transcribe"`.

## Adapter

`app/src/adapters/whisper/whisper-decision-client.ts`
- `buildWhisperDecisionRequest`: Feld `intent` (enum, `mode: keyword`) +
  `confirmed` (boolean), `options.fallback = "transcribe"`, `options.language`.
- `parseWhisperDecision`: liest `decision`/`fields` (`status`, `value`,
  `confidence`/`probability`, `coverage`) und `fallback.transcript`.

`app/src/adapters/whisper/whisper-decision-speech-input.ts`
- implementiert den bestehenden `SpeechInput`-Port: nimmt Audio auf, fragt die
  Decision an und gibt
  - das direkt entschiedene Produktlabel zurück, sonst
  - das Fallback-Transkript, sonst
  - `null` (bei `cancel`/`stop`/`repeat` oder Fehler).

`app/src/adapters/browser/wav-audio-recorder.ts`
- nimmt Mikrofonaudio auf und erzeugt **16-bit-PCM-WAV** (base64), das der
  Server ohne `--convert` akzeptiert.

## Server starten (lokal getestet)

```bash
build-cuda/bin/whisper-server \
  -m <modell>.bin \
  --host 127.0.0.1 --port 18160 \
  --decision-profiles examples/decision/profiles
```

Profile: `speech-commands-en`, `home-control-en`, `confirm-en-de`,
`intent-semantic-experimental`. Empfehlung laut Capability-Matrix: **base/small**,
Sprache **pinnen** (Auto-Detection auf Ein-Wort-Clips unzuverlässig).

## Konfiguration in der App

`index.html` (leer = Web-Speech-Fallback):

```html
<meta name="aisle-whisper-endpoint" content="http://127.0.0.1:18160" />
```

## Verifikation

- Unit: `app/tests/whisper-decision.test.ts` (Request-Aufbau, Parsing,
  Abstain, Cancel-Filter, Fehlerfälle).
- Live (optional): `AISLE_WHISPER_URL=... AISLE_WHISPER_AUDIO_B64=... npx vitest run tests/whisper-live.test.ts`.
- Referenzlauf lokal: `:18160`, base.en, confirm-Clip → `confirmed=False`
  p≈1.0, `fallback.used=false`; ~83 ms Decision.
- Grenzen (dokumentiert): abstrakte Intents nur über validierte Profile;
  DE-Yes/No experimentell; „keyword anywhere" nur über Transkription.

## Datenschutz

Lokal, kein Cloud-Dienst. `--decision-workers` nutzt einen `whisper_state`
pro Worker, `kv_self` wird pro Request geleert; kein Audio/Encoder-Output wird
über Requests hinweg gecacht.
