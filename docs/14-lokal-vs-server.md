# 14 – Was läuft lokal, was braucht optional Server/VLM?

Grundsatz: **Alles, was irgendwie lokal geht, läuft lokal.** Server/VLM ist
optional, austauschbar und niemals Voraussetzung für die Kernfunktion.

## 1. Kategorien

- **L** – vollständig lokal, offline nutzbar.
- **L\*** – lokal möglich, aber mit Qualitäts-/Ressourcenabstrichen.
- **L/S** – lokal als Standard, Server optional für bessere Qualität.
- **S** – praktisch nur mit Server/VLM sinnvoll (optionales Extra).

## 2. Zuordnung je Modul

| Modul | Kat. | Begründung |
|-------|------|------------|
| Push-to-talk / VAD | L | einfache Signalverarbeitung |
| STT (kurze Kommandos) | L | Vosk/sherpa-onnx klein und offline |
| STT (Freitext, laut) | L/S | große Whisper-Modelle brauchen Server/GPU |
| Intent (regelbasiert) | L | deterministisch, klein |
| Intent (LLM-Fallback) | S | nur für ungewöhnliche Formulierungen |
| Produktauflösung (Fuzzy) | L | Index/lokaler Katalog |
| Produktauflösung (Embeddings) | L\* | kleine Modelle im Browser möglich |
| TTS | L | Piper/Kokoro/Android TTS |
| Haptik | L | Vibration API |
| Karten/Ladenplan | L | lokale JSON/GeoJSON, offline gecacht |
| Pfadplanung (A*/Dijkstra) | L | trivialer Graph |
| Sprachführung | L | Template-Engine |
| Marker-Erkennung (ArUco) | L | OpenCV.js |
| VIO/VSLAM | L\* | ARCore nativ; OpenVINS/ORB-SLAM zu schwer für Web |
| Karten-Relokalisierung | L\* | möglich, aber rechenintensiv |
| Barcode (ZXing) | L | sehr leicht, offline |
| OCR (Tesseract) | L | offline, moderate Qualität |
| OCR (PaddleOCR) | L/S | bessere Qualität, mehr Ressourcen |
| Regalerkennung (klassisch) | L | Kanten/Linien, günstig |
| Objektdetektion (YOLOX/MediaPipe) | L\* | on-device möglich mit Abstrichen |
| Tiefenschätzung | L\* | relative Tiefe, rechenintensiv und unsicher |
| Produkt-Wiedererkennung (Embeddings) | L\* | Referenzbilder + kleine Modelle |
| VLM „Was steht hier?“ | **S** | nur remote/serverseitig in guter Qualität |
| VLM lokal (Moondream/SmolVLM) | L\* | geringe Qualität, nur als Notfall |
| Katalog-Anreicherung (OFF) | L/S | lokaler Cache + optionaler Sync |
| SLAM-Offline-Kartenbau | S | Kartierung serverseitig/offline-Werkzeug |
| Crowdsourcing-Karten | S | Backend zum Austausch, optional |

## 3. Lokaler Standardpfad (MVP)

```
Push-to-talk → Vosk (STT) → Regel-Intent → lokale Fuzzy-Auflösung
   → ArUco/Dead-Reckoning-Lokalisierung → A* → Piper-TTS + Haptik
   → Tesseract.js (OCR) + ZXing (Barcode) → Safety Supervisor
```

**Kein Netzwerk erforderlich.** Karte, Katalog und Modelle sind lokal gecacht.

## 4. Wann wird Server/VLM zugeschaltet? (nur optional)

- Nutzer wählt explizit „Erweiterte Erkennung“ für eine unbekannte Situation.
- STT versteht im Lärm nicht zuverlässig (Cloud-ASR).
- OCR scheitert und ein VLM soll das Regal beschreiben.
- Kartierung/Relokalisierung wird serverseitig vorberechnet.

Jede Zuschaltung ist:
1. **sichtbar** (einfache Ansage: „Ich nutze jetzt eine Online-Hilfe.“),
2. **abwählbar**,
3. **flüchtig** (keine Speicherung),
4. **austauschbar** (Adapter, kein Vendor Lock-in).

## 5. Degradationsstrategie (Graceful Degradation)

| Situation | Verhalten |
|-----------|-----------|
| Kein Netz | vollständiger lokaler Pfad (Standard) |
| STT lokal unsicher | Rückfrage / Push-to-talk erneut |
| VLM nicht verfügbar | „Ich kann das Regal nicht beschreiben“ – kein Raten |
| Lokalisierung verloren | explizite Unsicherheit, Neu-Ausrichtung via Marker |
| Tiefe nicht verfügbar | bestätigungsbasierter Dialog |

## 6. Empfehlung

- **MVP und Prototyp:** ausschließlich lokal (L), Server nur für Evaluation.
- **VLM:** erst später, nur als optionales Extra mit klarer Kennzeichnung.
- **Leitlinie:** Kernfunktion muss **vollständig ohne Cloud** funktionieren;
  Cloud ist Komfort, nicht Fundament.
