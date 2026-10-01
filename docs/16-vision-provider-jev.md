# 16 – Vision-Provider: llama.cpp-vision-decision (Jev-Modus)

Der MVP nutzt als Standard-Vision-Adapter **Jev-Modus** auf
`ananta888/llama.cpp-vision-decision`: statt ein JSON Token für Token zu
generieren, werden pro Feld nur die erlaubten Werte bewertet und mit
Wahrscheinlichkeit zurückgegeben. Das liefert kalibrierbare Konfidenz und
Abstain – ideal für unser Safety-/Confidence-Modell.

## Endpoint

```text
POST <baseUrl>/v1/decision
```

- `mode: "tree"`, `return_probs: true`, `cache_context: false`
- `contexts`: eine `image_url` (Data-URI) + ein kurzer `text`-Part
- Antwort: `results[0].fields[<key>] = { value, probability, margin?, abstain? }`

Referenz: `llama.cpp-vision-decision/tools/parallel-decision/README.md`.

## Unser Feld-Schema

Der Adapter `app/src/adapters/jev/jev-vision-decision-detector.ts` sendet vier
typisierte Felder:

| Feld | Typ | Werte | Bedeutung |
|------|-----|-------|-----------|
| `detected` | boolean | – | Ist das Zielprodukt sichtbar? (`abstain.min_probability`) |
| `horizontal` | enum | `left` / `center` / `right` | horizontale Position |
| `vertical` | enum | `up` / `center` / `down` | vertikale Position |
| `size` | enum | `small` / `medium` / `large` | Anteil der Bildhöhe (→ „erreicht“) |

## Mapping in die Domain

```
detected.probability   -> Observation.confidence
detected.value         -> ProductCandidate.detected
horizontal/vertical    -> RelativePosition
size                   -> BoundingBox.height (small .15 / medium .35 / large .60)
abstain | p < min      -> nicht erkannt + Uncertainty{reason}
```

`size = large` + zentriert löst über die Guidance-Regeln
`Das Produkt ist direkt vor dir.` aus.

## Konfidenz und Abstain

- Die rohe `probability` ist **nicht** automatisch die Trefferwahrscheinlichkeit.
  Schwellen (`temperature`, `abstain`) gehören kalibriert – siehe
  `bench/evaluate.py` im Fork.
- Unser Adapter behandelt `abstain: true` oder `p < minProbability` (Default
  0.5) als unsichere Nicht-Erkennung. Es wird **nie** geraten.

## Server starten (eGPU / WSL2)

```bash
build-cuda/bin/llama-server --host 0.0.0.0 --port 18150 \
  -m  <modell>.gguf --mmproj <mmproj>.gguf \
  -c 65536 -np 2 --decision-seqs 12 --decision-ctx-cache 1 \
  -ngl 99 -fa on --image-max-tokens 1024 -ctk q8_0 -ctv q8_0
```

- `--decision-seqs` reserviert die Sequenzslots für den Decision-Modus.
- CORS ist serverseitig offen (`Access-Control-Allow-Origin` wird gespiegelt),
  daher darf die PWA den Server direkt ansprechen.

## Konfiguration in der App

`index.html`:

```html
<meta name="aisle-decision-endpoint" content="http://127.0.0.1:18150" />
```

Der generische `RemoteVlmTargetProductDetector` (freies JSON) bleibt als
alternativer Adapter hinter demselben Port erhalten.

## Verifikation

- Unit: `app/tests/jev-vision-decision-detector.test.ts` (Parsing, Abstain,
  Fehlerfälle, Request-Aufbau).
- Live (optional, gegen laufenden Server):
  `AISLE_DECISION_URL=... AISLE_DECISION_IMAGE_B64=... npx vitest run tests/jev-live.test.ts`
- Referenzlauf (Bonsai 27B, RTX 5060 Ti): `detected` p=0.9998,
  `horizontal=right` p=0.98, `size=large` p=0.77, ~1.4 s pro Entscheidung.

## Datenschutz

Der Server läuft lokal; `cache_context: false` verhindert Wiederverwendung von
Kontext über Anfragen. Bilder werden als Data-URI übertragen und nicht
gespeichert. Kein Cloud-Dienst erforderlich.
