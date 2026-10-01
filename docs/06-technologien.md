# 06 – Open-Source-Technologien und Modelle je Modul

**Auswahlkriterien:** permissive Lizenz bevorzugt, On-Device-Tauglichkeit,
aktive Pflege, austauschbar hinter einem Port. Die Lizenzspalte ist eine
Arbeitsgrundlage – **jede Lizenz muss vor Übernahme final geprüft werden**
(siehe Warnhinweise).

## 0. Lizenz-Ampel

| Ampel | Bedeutung |
|-------|-----------|
| 🟢 | Permissiv (MIT/Apache/BSD) – bevorzugt |
| 🟡 | Copyleft (GPL/LGPL/MPL/ODbL) – Integration prüfen, ggf. isolieren |
| 🔴 | AGPL oder Non-Commercial/Research – **nicht** im Standardpfad, nur optional/remote oder meiden |

---

## 1. Speech-to-Text

| Projekt | Lizenz | Laufzeit | Anmerkung |
|---------|--------|----------|-----------|
| Vosk | Apache-2.0 🟢 | L | klein, offline, viele Sprachen |
| whisper.cpp | MIT 🟢 | L | Whisper offline, CPU tauglich |
| faster-whisper | MIT 🟢 | L/S | schnelle Whisper-Reimplementierung |
| sherpa-onnx | Apache-2.0 🟢 | L | Streaming-ASR, sehr mobiltauglich |
| Web Speech API | Browser/Plattform 🟡 | L/S | Android oft gut, verdeckt Server-Cloud |
| Kaldi | Apache-2.0 🟢 | L/S | mächtig, komplex |

Empfehlung MVP: **Vosk oder sherpa-onnx** (lokal, kurz), Web Speech als Fallback.

## 2. Text-to-Speech

| Projekt | Lizenz | Laufzeit | Anmerkung |
|---------|--------|----------|-----------|
| Piper | MIT (Code) 🟢 | L | neuronale TTS; **Stimmenlizenzen je Voice prüfen** |
| Kokoro | Apache-2.0 🟢 | L | gute Qualität, klein |
| eSpeak NG | GPL-3.0 🟡 | L | sehr klein/robust, klanglich einfach |
| Android TTS | Plattform 🟡 | L | systemintegriert, Screenreader-nah |
| Coqui XTTS | MPL (Code) / CPML-Modell 🔴 | L/S | **Modell nicht kommerziell** – meiden |

Empfehlung MVP: **Piper** (Stimme mit freier Lizenz) oder Android TTS.

## 3. Intent & Produktauflösung

| Projekt | Lizenz | Anmerkung |
|---------|--------|-----------|
| Eigene Regel-/Slot-Engine | – | MVP, erklärbar, deterministisch |
| spaCy | MIT 🟢 | NLP, Regeln + kleine Modelle |
| Duckling | Apache-2.0 🟢 | Zahlen/Einheiten/Mengen |
| sentence-transformers | Apache-2.0 🟢 | Embedding-Suche für Produktnamen |
| transformers.js | Apache-2.0 🟢 | Embeddings im Browser |
| Rasa / Rasa NLU | Apache-2.0 (Core) 🟢/🟡 | Overkill für MVP |
| LLM (via Ollama) | MIT (Ollama) 🟢 / Modell je Lizenz | nur Fallback, optional |

Empfehlung MVP: **eigene regelbasierte Engine + Fuzzy-Match**; Embeddings später.

## 4. Objekt-/Personen-/Regalerkennung

| Projekt | Lizenz | Anmerkung |
|---------|--------|-----------|
| OpenCV (klassische CV) | Apache-2.0 🟢 | Linien/Kanten/Regalböden – **erste Wahl** |
| MediaPipe | Apache-2.0 🟢 | mobile Erkennung, on-device |
| YOLOX | Apache-2.0 🟢 | Detektor, permissiv |
| MMDetection / RT-DETR | Apache-2.0 🟢 | Detektor-Framework |
| NanoDet | Apache-2.0 🟢 | sehr leicht |
| Ultralytics YOLOv8/v11 | AGPL-3.0 🔴 | **AGPL-Risiko** – nur isoliert/remote oder meiden |
| FastSAM | AGPL-3.0 🔴 | AGPL – meiden |
| SAM / MobileSAM | Apache-2.0 (SAM) 🟢 | Segmentierung, schwer |

Empfehlung: **klassische CV zuerst**, dann **YOLOX/MediaPipe**. AGPL-Modelle
nicht in den ausgelieferten Client.

## 5. OCR

| Projekt | Lizenz | Laufzeit | Anmerkung |
|---------|--------|----------|-----------|
| Tesseract / tesseract.js | Apache-2.0 🟢 | L | robust, offline |
| PaddleOCR | Apache-2.0 🟢 | L/S | sehr stark, mobil möglich |
| EasyOCR | Apache-2.0 🟢 | L/S | einfach, PyTorch |
| docTR | Apache-2.0 🟢 | L/S | Dokumente |
| ML Kit Text Recognition | proprietär/gratis 🟡 | L | on-device, kein OSS |

Empfehlung MVP: **Tesseract.js** (Browser); später PaddleOCR für Qualität.

## 6. Barcode

| Projekt | Lizenz | Anmerkung |
|---------|--------|-----------|
| ZXing (zxing-js) | Apache-2.0 🟢 | Standard, EAN/GTIN |
| zbar | LGPL-2.1 🟡 | bewährt |
| ML Kit Barcode | proprietär/gratis 🟡 | on-device, gut |

## 7. Tiefe / 3D

| Projekt | Lizenz | Anmerkung |
|---------|--------|-----------|
| Depth Anything | Apache-2.0 🟢 | relative Tiefe, nicht metrisch |
| MiDaS | MIT 🟢 | relative Tiefe |
| ARCore Depth | proprietär 🟡 | echte Tiefe, nur Teilgeräte |

Immer als unsicher kennzeichnen; nicht für Sicherheitsaussagen.

## 8. Visual SLAM / Lokalisierung / Kamerapose

| Projekt | Lizenz | Anmerkung |
|---------|--------|-----------|
| OpenCV (ArUco/Kalibrierung) | Apache-2.0 🟢 | Marker + Pose |
| AprilTag | BSD-2-Clause 🟢 | sehr robuste Fiducials |
| RTAB-Map | BSD-2-Clause 🟢 | SLAM + Relokalisierung |
| OpenVINS | GPL-3.0 🟡 | VIO, stark, Copyleft |
| ORB-SLAM3 | GPL-3.0 🟡 | Referenz-SLAM, Copyleft |
| Basalt | BSD-3-Clause 🟢 | VIO |
| ARCore / ARKit | proprietär/gratis 🟡 | pragmatisch, kein OSS |

Empfehlung MVP: **ArUco/AprilTag + einfaches Dead-Reckoning**;
Prototyp: **ARCore-VIO** oder **RTAB-Map**.

## 9. Navigation & Karten

| Projekt | Lizenz | Anmerkung |
|---------|--------|-----------|
| NetworkX | BSD-3-Clause 🟢 | A*/Dijkstra im Prototyp |
| Eigene A*-Implementierung | – | MVP, klein und schnell |
| OpenStreetMap Indoor (Simple Indoor Tagging) | ODbL 🟡 | Kartenstandard + Daten |
| Valhalla | MIT 🟢 | Routing (outdoor, Indoor eingeschränkt) |
| OpenLevelUp | – | OSM-Indoor-Visualisierung |

## 10. VLM/LLM (optional, remote)

| Projekt | Lizenz | Anmerkung |
|---------|--------|-----------|
| Ollama | MIT 🟢 | einfacher lokaler Server |
| llama.cpp | MIT 🟢 | GGUF-Inferenz |
| Qwen2.5-VL | Apache-2.0 (i. d. R.) 🟢 | stark, Lizenz je Checkpoint prüfen |
| Moondream2 | Apache-2.0 🟢 | klein, lokal möglich |
| SmolVLM | Apache-2.0 🟢 | sehr klein, lokal |
| LLaVA | Apache-Code / **LLaMA-Basis non-commercial** 🔴 | Modellgewichte-Lizenz prüfen |

Nur optional, nur mit klarer Kennzeichnung, niemals sicherheitskritisch.

## 11. Produktdaten

| Quelle | Lizenz | Anmerkung |
|--------|--------|-----------|
| Open Food Facts (Daten) | ODbL-1.0 🟡 | Share-Alike für Daten, sehr wertvoll |
| Open Food Facts (Code) | AGPL-3.0 🔴 | Code nicht einbinden, nur API/Daten |
| Open Products Facts | ODbL 🟡 | Nicht-Lebensmittel |
| Wikidata | CC0 🟢 | Zusatzinformationen |
| GS1/GTIN | Standard | Barcode-Struktur, keine freie DB |

**ODbL-Hinweis:** Bei Veröffentlichung abgeleiteter Datenbanken gelten
Share-Alike-Pflichten – separat dokumentieren.

## 12. Client-/UI-Stack

| Zweck | Kandidat | Lizenz |
|-------|----------|--------|
| PWA-Framework | SvelteKit / React / Vue | MIT 🟢 |
| Native Brücke | Capacitor | MIT 🟢 |
| Native Android | Kotlin + CameraX | Apache-2.0 🟢 |
| Native Cross-Platform | Flutter | BSD-3-Clause 🟢 |
| AR im Browser | WebXR | W3C-Standard, Umsetzung plattformabhängig 🟡 |
| ML im Browser | ONNX Runtime Web / transformers.js | MIT / Apache 🟢 |
| ARIA/Accessibility | WAI-ARIA APG | W3C 🟢 |

## 13. Testing-Spezifika

| Zweck | Kandidat | Lizenz |
|-------|----------|--------|
| E2E Web | Playwright | Apache-2.0 🟢 |
| Barrierefreiheit | axe-core | MPL-2.0 🟡 |
| a11y-CLI | pa11y | LGPL-3.0 🟡 |
| Python-Tests | pytest | MIT 🟢 |
| Mobile E2E | Appium | Apache-2.0 🟢 |

## 14. Backend (optional)

| Zweck | Kandidat | Lizenz |
|-------|----------|--------|
| API | FastAPI (Python) | MIT 🟢 |
| Alternative | Axum (Rust) | MIT/Apache 🟢 |
| Container | Docker | Apache-2.0 🟢 |
| Inferenz-Server | vLLM | Apache-2.0 🟢 |

## 15. Zusammenfassender MVP-Stack (empfohlen)

```
PWA (TypeScript, SvelteKit)
  STT:      Vosk / Web Speech (Fallback)
  TTS:      Piper (freie Stimme) / Android TTS
  Intent:   eigene Regel-Engine + Fuzzy
  Katalog:  lokale JSON-Liste (Testmarkt), später OFF
  Marker:   ArUco (OpenCV.js)
  Nav:      eigene A* + lokale JSON-Karte
  OCR:      Tesseract.js
  Barcode:  ZXing-js
  Safety:   eigener Supervisor
Backend: keines (optional Docker + FastAPI + Ollama)
```
