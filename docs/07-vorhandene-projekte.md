# 07 – Bestehende Open-Source-Projekte zum Wiederverwenden oder Integrieren

Diese Übersicht trennt **direkt integrierbare Bausteine** von **Inspiration /
Referenz**. Nicht jedes Projekt ist Open Source – auch bekannte kommerzielle
Produkte werden als Referenz genannt, weil sie Nutzererwartungen und UX-Muster
definieren.

## 1. Direkt integrierbare Bibliotheken

| Bereich | Projekt | Wiederverwendung |
|---------|---------|------------------|
| CV-Basis | OpenCV | Marker, Kalibrierung, klassische CV, Regal-/Linienanalyse |
| Fiducials | AprilTag, ArUco | Ankerpunkte für Groblokalisierung |
| SLAM/VIO | RTAB-Map, Basalt, OpenVINS, ORB-SLAM3 | Relokalisierung/Kamerapose (Lizenz beachten) |
| Detektion | MediaPipe, YOLOX, MMDetection | Regale/Objekte/Personen |
| OCR | Tesseract, PaddleOCR, docTR | Produktnamen/Preisschilder |
| Barcode | ZXing, zbar | GTIN-Lesen |
| Tiefe | Depth Anything, MiDaS | grobe Abstandsinfo |
| ASR | Vosk, whisper.cpp, faster-whisper, sherpa-onnx | Spracheingabe |
| TTS | Piper, Kokoro, eSpeak NG | Sprachausgabe |
| Routing | NetworkX, Valhalla | Pfadplanung |
| Inferenz | ONNX Runtime, llama.cpp, Ollama, vLLM | lokale/remote Modelle |
| A11y-Test | axe-core, pa11y, Playwright | automatisierte Barrierefreiheitstests |

## 2. Karten, Standards und Daten

| Projekt/Standard | Rolle |
|------------------|-------|
| OpenStreetMap Indoor / Simple Indoor Tagging | offenes Datenmodell für Innenräume |
| OpenLevelUp | OSM-Indoor-Darstellung (Referenz) |
| IndoorGML | Standard für Indoor-Navigation |
| Wayfindr Open Standard | offener Standard für **Audio-Wegführung** – sehr relevant |
| OpenSidewalks | offene Gehweg-/Barrierefreiheitsdaten (outdoor) |
| Open Food Facts (ODbL) | Produkt-/GTIN-Daten, sehr wertvoll |
| Open Products Facts | Nicht-Lebensmittel |
| Wikidata | Ergänzungsdaten (CC0) |

**Wayfindr** ist besonders wichtig: Der offene Standard beschreibt, wie
Sprachanweisungen für blinde Nutzende im Innenraum formuliert sein sollten –
das sollte unsere `GuidanceGenerator`-Templates prägen.

## 3. Accessibility-Referenzen

| Projekt/Standard | Rolle |
|------------------|-------|
| WAI-ARIA Authoring Practices (W3C) | Muster für zugängliche Komponenten |
| WCAG 2.2 | Prüfkriterien (Ziel AA) |
| EN 301 549 | Europäische Barrierefreiheitsanforderung |
| BITV 2.0 | Deutsche Umsetzung (öffentliche Stellen) |
| Section 508 | US-Vergabekriterium |
| The A11Y Project | Praxis-Checklisten |

## 4. Vergleichbare Produkte / Forschung (Inspiration, meist proprietär)

| Produkt/Projekt | Lehre für uns |
|-----------------|---------------|
| Microsoft Seeing AI | Szenenbeschreibung + OCR-Erzählung; Vorbild für Moduslogik |
| Google Lookout | Objekt-/Textmodi, Feedback-Design |
| Envision AI | schnelle OCR/Describe-UX |
| Be My Eyes | menschliche Fallback-Vermittlung – denkbar als optionale Hilfe |
| Aira | kommerzieller Agent – zeigt Grenzen rein automatischer Ansätze |
| OrCam / MyEye | Hardware-Ansatz, für uns nicht Ziel („nur Smartphone“) |
| GoodMaps Explore | Indoor-Wayfinding, teils CV-basiert |
| NavCog (IBM) | Forschung zu Blinden-Navigation im Innenraum |
| Soundscape (Microsoft) | 3D-Audio-Orientierung, open-source (Android/iOS) |
| BlindSquare | Audio-Wayfinding (kommerziell) |
| Project Guideline (Google) | geführte Navigation per Vision (Laufstrecke) |
| Amazon Go | zeigt: SKU-Erkennung braucht Sensorik, nicht nur eine Kamera |
| Wayfindr | Audio-Navigationsstandard (siehe oben) |

**Soundscape** ist als echte Open-Source-Referenz für 3D-Audio-Orientierung
besonders wertvoll.

## 5. Wiederverwendungsstrategie

1. **Lizenz zuerst prüfen** und in der `LICENSES/`-Dokumentation festhalten.
2. **Copyleft isolieren:** GPL/AGPL-Komponenten nur in separaten, optionalen
   Diensten (Prozess-/Netzwerkgrenze), nicht im verteilten Client.
3. **Adapter statt Fork:** Jede Übernahme hinter einem Port kapseln.
4. **Beitrag statt Duplikat:** Wo sinnvoll, Upstream-Änderungen anstreben.

## 6. Konkrete Synergien

- **Wayfindr-Standard** + `GuidanceGenerator` → konsistente, evaluierte Sprachführung.
- **OSM Indoor** + eigenes Kartierungswerkzeug → Karten ohne Vendor Lock-in.
- **Open Food Facts** + Barcode → Katalog ohne eigene Datenpflege.
- **Soundscape** → Muster für akustische Orientierung und räumliches Audio.
- **axe-core** in CI → Barrierefreiheit als Regressionsschutz.
