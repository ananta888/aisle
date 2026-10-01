# 03 – Modulaufteilung

Jedes Modul ist ein **Port** (Interface) mit austauschbaren **Adaptern**.
Konfidenz, Unsicherheit und Quelle sind Teil jedes Ergebnisses.

Legende `Laufzeit`: **L** = lokal, **S** = optional Server, **L/S** = hybrid.

---

## 1. Eingabe / Ausgabe

### `SpeechInput`
- **Zweck:** Audio → Text.
- **Interface:** `transcribe(audio, opts) -> Observation<string>`
- **Adapter:** Vosk, whisper.cpp / faster-whisper, sherpa-onnx, Web Speech API.
- **Laufzeit:** L (kurze Kommandos); S optional für Freitext/Lärm.

### `SpeechOutput`
- **Zweck:** Text → Sprache, priorisiert, unterbrechbar.
- **Interface:** `speak(text, priority) -> void`, `cancel() -> void`
- **Adapter:** Piper, eSpeak NG, Android TTS, Web Speech Synthesis.
- **Laufzeit:** L.

### `HapticOutput`
- **Zweck:** Vibrationsmuster (z. B. Richtungscodes, Warnungen).
- **Interface:** `pattern(name) -> void`
- **Adapter:** Vibration API / Android Vibrator.
- **Laufzeit:** L.

### `DialogManager`
- **Zweck:** Sprachdialog, Rückfragen, Bestätigungen, Fokus-/ARIA-Verwaltung.
- **Interface:** `say()`, `prompt()`, `confirm()`, `interrupt()`
- **Laufzeit:** L.

---

## 2. Verstehen

### `IntentParser`
- **Zweck:** Äußerung → Intent + Slots (z. B. `find_product{query:"Hafermilch"}`).
- **Interface:** `parse(text) -> Observation<Intent>`
- **Adapter:** regelbasiert (MVP), spaCy, Duckling, Embedding-Classifier.
- **Laufzeit:** L.

### `ProductResolver`
- **Zweck:** Freitext-Query → Katalogtreffer (Kategorie/Produkt/GTIN).
- **Interface:** `resolve(query) -> Observation<ProductRef[]>`
- **Adapter:** exakter Match, Fuzzy (Levenshtein), Embedding-Suche.
- **Laufzeit:** L.

### `ProductCatalog`
- **Zweck:** Produkt-/Kategoriedaten, GTIN→Name, Alternativen.
- **Interface:** `lookup(gtin)`, `search(text)`, `similar(ref)`
- **Adapter:** Open Food Facts, lokaler Cache, Händler-Feed.
- **Laufzeit:** L (Cache) / S (Feeds).

---

## 3. Wahrnehmung (Vision / Sensorik)

### `SensorSource`
- **Zweck:** Einheitlicher Zugriff auf Kamera, IMU, Mikrofon, Uhrzeit.
- **Interface:** `frames()`, `imu()`, `audio()`
- **Adapter:** getUserMedia/WebXR, CameraX (Android), ARCore/ARKit.
- **Laufzeit:** L.

### `VisualLocalizer` (Grobnavigation)
- **Zweck:** Position+Pose im Laden aus VIO + Karte + Markern.
- **Interface:** `localize(frame, imu) -> Observation<Pose>`
- **Adapter:** Markerbasiert (AprilTag/ArUco) + VIO (ARCore/OpenVINS/RTAB-Map).
- **Laufzeit:** L.

### `MarkerDetector`
- **Zweck:** Fiducial-Anker erkennen (Regalenden, Eingänge).
- **Interface:** `detect(image) -> Observation<Marker[]>`
- **Adapter:** OpenCV ArUco, AprilTag.
- **Laufzeit:** L.

### `ShelfRecognizer`
- **Zweck:** Regalstruktur, Böden/Ebenen, horizontale Segmente erkennen.
- **Interface:** `analyze(image) -> Observation<ShelfModel>`
- **Adapter:** klassische CV (Kanten/Hough/Linien), optional Detektor.
- **Laufzeit:** L.

### `OCR`
- **Zweck:** Produktnamen, Preisschilder, Regalbeschriftungen lesen.
- **Interface:** `read(image, region?) -> Observation<TextBlock[]>`
- **Adapter:** Tesseract, PaddleOCR, docTR, ML Kit (optional).
- **Laufzeit:** L.

### `BarcodeScanner`
- **Zweck:** EAN/GTIN lesen – die zuverlässigste Produkt-ID.
- **Interface:** `scan(image) -> Observation<Code[]>`
- **Adapter:** ZXing, zbar, ML Kit Barcode.
- **Laufzeit:** L.

### `ObjectDetector`
- **Zweck:** Allgemeine Objekte/Regale/Personen/Hindernisse.
- **Interface:** `detect(image) -> Observation<Detection[]>`
- **Adapter:** YOLOX, MMDetection, MediaPipe, NanoDet.
- **Laufzeit:** L.

### `DepthEstimator`
- **Zweck:** Relative/metrische Tiefe für Abstandshinweise.
- **Interface:** `estimate(image) -> Observation<DepthMap>`
- **Adapter:** Depth Anything, MiDaS, ARCore Depth (falls verfügbar).
- **Laufzeit:** L; immer als unsicher gekennzeichnet.

### `VLMService` (optional)
- **Zweck:** Freies semantisches Verständnis („Was steht hier?“, unbekannte Verpackung).
- **Interface:** `describe(image, prompt) -> Observation<Text>`
- **Adapter:** remote (Qwen2.5-VL, LLaVA) via Ollama/vLLM; lokal nur sehr klein (Moondream/SmolVLM).
- **Laufzeit:** S (optional), standardmäßig deaktiviert.

---

## 4. Navigieren

### `MapProvider`
- **Zweck:** Ladenkarte laden/erzeugen (Graph, Zonen, Anker).
- **Interface:** `load(storeId) -> StoreMap`, `anchors() -> Anchor[]`
- **Adapter:** lokale JSON/GeoJSON, OpenStreetMap Indoor, Editor-Export.
- **Laufzeit:** L.

### `PathPlanner` (Grobnavigation)
- **Zweck:** Route von Pose zu Ziel.
- **Interface:** `plan(map, from, to) -> Path`
- **Adapter:** A* / Dijkstra (NetworkX oder eigene Implementierung).
- **Laufzeit:** L.

### `GuidanceGenerator`
- **Zweck:** Route → verständliche Sprach-/Haptikschritte.
- **Interface:** `step(path, pose) -> Observation<Instruction>`
- **Adapter:** Template-Engine (lokalisiert, mehrsprachig).
- **Laufzeit:** L.

### `FinePositioner`
- **Zweck:** Produkt relativ zu Kamera/Nutzer am Regal.
- **Interface:** `position(productRef, shelf, frame) -> Observation<RelativePose>`
- **Adapter:** OCR/Barcode + Regalgeometrie + grobe Tiefe.
- **Laufzeit:** L.

---

## 5. Verwalten / Querschnitt

### `AssistantOrchestrator`
- **Zweck:** Zustandsautomat, koordiniert alle Ports.
- **Laufzeit:** L.

### `SafetySupervisor`
- **Zweck:** Prüft/entschärft jede Ausgabe, verwaltet Unsicherheit.
- **Laufzeit:** L.

### `ConfidenceFusion`
- **Zweck:** Mehrere Beobachtungen zu einer Schätzung fusionieren.
- **Laufzeit:** L.

### `StoreProfile` / `LocationProfile`
- **Zweck:** Ort-spezifische Konfiguration (Karte, Katalog, Vokabular, Policy).
- **Laufzeit:** L.

### `CacheStore`
- **Zweck:** Offline-Caching von Karten, Katalogen, STT-/TTS-Modellen.
- **Interface:** `get()/put()/invalidate()`
- **Adapter:** IndexedDB (PWA), SQLite.
- **Laufzeit:** L.

### `Telemetry` (optional, opt-in)
- **Zweck:** Anonyme, aggregierte Qualitätsmetriken; standardmäßig aus.
- **Laufzeit:** L/S (nur nach ausdrücklicher Zustimmung).

---

## 6. Modulabhängigkeiten (vereinfacht)

```
SpeechInput → IntentParser → ProductResolver → ProductCatalog
                                   │
Localizer ← SensorSource → PathPlanner → GuidanceGenerator
                                   │
                          FinePositioner ← OCR/Barcode/Shelf/Depth
                                   │
                    SafetySupervisor → SpeechOutput/HapticOutput/DialogManager
```

Kein Modul importiert ein anderes direkt; Kommunikation läuft über den
Orchestrator und den Event-Bus.
