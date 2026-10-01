# 02 – Gesamtarchitektur

> **MVP-Hinweis:** Für die erste Version gilt
> [15-mvp-priority.md](15-mvp-priority.md). Die hier beschriebenen Schichten
> und Ports bleiben gültig, aber **Karte, VIO/SLAM, Lokalisierung und
> Grobnavigation sind nicht Teil des MVP** und werden erst als spätere
> Erweiterungen aktiviert. Der Orchestrator startet mit der geschlossenen
> Perception-Guidance-Schleife.

## 1. Architekturprinzipien

1. **Edge-first, offline-capable.** Alles, was lokal laufen kann, läuft lokal.
   Server ist optional und austauschbar.
2. **Hybrid statt KI-zentriert.** Deterministische Pipeline (CV/OCR/SLAM/Navigation)
   ist der Standardpfad; KI/VLM ist ein optionaler, zuschaltbarer Dienst.
3. **Hexagonal / Ports & Adapters.** Jede Fähigkeit ist ein Interface (Port);
   konkrete Modelle/Engines sind Adapter, per Konfiguration wählbar.
4. **Zwei Navigationsschichten strikt getrennt:** `gross_navigation` (Gang/Regal)
   und `fine_positioning` (Produkt am Regal).
5. **Konfidenz ist first-class.** Jedes Ergebnis trägt einen `Confidence`-Wert;
   die Entscheidungs- und Dialoglogik nutzt ihn.
6. **Safety Supervisor über allem.** Kein Ausgabesatz, der eine Sicherheitsgarantie
   impliziert, verlässt das System ungeprüft.
7. **Ereignisgetrieben & zustandsbasiert.** Ein Orchestrator als endlicher
   Zustandsautomat koordiniert Sensoren, Verarbeitung und Dialog.
8. **Ort-generisch.** Der Supermarkt ist ein *Profil*; die Kernlogik kennt nur
   „Karte, Zonen, Anker, Objekte“. Weitere Orte sind Konfiguration, kein Fork.

## 2. Schichtenmodell

```
┌─────────────────────────────────────────────────────────────┐
│  A. Nutzeroberfläche / Dialog                                │
│     Sprachdialog, Screenreader/ARIA, Haptik, Minimal-UI      │
├─────────────────────────────────────────────────────────────┤
│  B. Orchestrierung                                           │
│     Assistant Orchestrator (State Machine) + Safety Supervisor│
├─────────────────────────────────────────────────────────────┤
│  C. Fähigkeiten (Ports)                                      │
│     SpeechIn/Out · Intent · Localizer · Planner · Vision     │
│     OCR · ProductMatch · Catalog · MapProvider               │
├─────────────────────────────────────────────────────────────┤
│  D. Adapter (Modelle/Engines, lokal ODER remote)             │
│     Whisper/Vosk/Piper · YOLOX/MediaPipe · Tesseract/Paddle  │
│     ZXing · VIO/ArUco · A*/NetworkX · VLM-Adapter            │
├─────────────────────────────────────────────────────────────┤
│  E. Infrastruktur                                            │
│     Kamera/IMU/Mikro (Sensor-Abstraktion) · Event-Bus         │
│     Lokaler Cache/Store-Maps · Optionales Backend (Docker)   │
└─────────────────────────────────────────────────────────────┘
```

## 3. Laufzeitfluss (Referenzpfad)

```
[Nutzer spricht]
      │
      ▼
SpeechInput ──► IntentParser ──► ProductResolver ──► Produktkatalog-Treffer
                                                         │
   ┌─────────────────────────────────────────────────────┘
   ▼
Localizer (Karte + Marker + VIO) ──► Planner (A*) ──► Grobroute
   │
   ▼
Dialog: "Gang 4, etwa 10 m geradeaus."  ◄── Safety Supervisor
   │  (währenddessen kontinuierlich: Sensorik → Localizer → ggf. Neuplanung)
   ▼
Am Zielregal: VisionPipeline (Regalerkennung + OCR/Barcode + Tiefe)
   │
   ▼
ProductMatcher ──► FinePositioning ──► Dialog: "Etwas nach rechts..."
   │
   ▼
Bestätigung (Barcode/OCR) + Abschluss ("Produkt gefunden / nicht sicher")
```

Jeder Pfeil transportiert `{payload, confidence, source, timestamp}`.
Fällt `confidence` unter einen Schwellwert, wechselt der Orchestrator in einen
**Rückfrage-/Neuversuch-Zustand** statt zu raten.

## 4. Zustandsautomat des Orchestrators

`idle → listening → resolving_product → localizing → navigating → arrived_at_shelf
 → fine_positioning → confirming → done`

Sonderzustände:
- `uncertain` – Unsicherheit, Rückfrage oder erneuter Scan.
- `paused` – Nutzerstopp oder Sicherheitshinweis.
- `obstacle_warning` – mögliche Hinderniserkennung, explizit als unsicher markiert.
- `lost` – Lokalisierung verloren, Rückkehr zu `localizing`.

## 5. Zwei Navigationsschichten

### 5.1 Grobnavigation
- Eingabe: Startposition, Ziel (Gang/Regal/Kategorie).
- Karte als Graph: Knoten = Orte/Schnittpunkte, Kanten = begehbare Segmente mit
  Länge und Breite.
- Algorithmus: A*/Dijkstra (NetworkX oder eigene Implementierung).
- Ausgabe: Sprachschritte („geradeaus“, „rechts“, „durch den Gang“) und Distanzen,
  zusätzlich als Haptikmuster.

### 5.2 Feinpositionierung
- Eingabe: Kamerabild am Regal, gesuchtes Produkt, Regalgeometrie.
- Verfahren: Regalerkennung (horizontale Ebenen/Regalböden) → OCR/Barcode-Erkennung
  im Bild → Zuordnung des Ziels zu einer Ebene und horizontalen Region →
  relative Anweisung (links/rechts/hoch/runter/vor), jeweils mit Konfidenz.
- Bestätigung durch erneutes Lesen des Barcodes oder Produktnamens.

## 6. Vertrauens- und Konfidenzmodell

```ts
type Confidence = number; // 0.0 .. 1.0

interface Observation<T> {
  value: T;
  confidence: Confidence;
  source: string;      // z.B. "ocr:tesseract", "vio:arcore", "marker:apriltag"
  timestamp: number;
  uncertainty?: { reason: string; suggestedAction?: string };
}
```

Regeln:
- Kein Ergebnis wird ohne `confidence` konsumiert.
- Unter `tau_low` (z. B. 0.4): nicht berichten, stattdessen erneut versuchen
  oder Nutzer fragen.
- Zwischen `tau_low` und `tau_high`: berichten **mit** Unsicherheitshinweis.
- Über `tau_high`: normale Ansage.
- Schwellwerte sind konfigurierbar und pro Modul unterschiedlich.

## 7. Safety Supervisor

Zentrale Komponente, die jede nach außen gehende Aussage prüft:
- Ersetzt/ergänzt Garantieformulierungen durch Wahrscheinlichkeitsformulierungen.
- Bei `obstacle_warning` immer „möglicherweise“ / „bitte kurz stopp“.
- Bei `lost`/`uncertain` keine erfundenen Positionen.
- Führt ein Audit-Log (flüchtig, optional lokal) über sicherheitsrelevante Zustände.

## 8. Konfiguration & Austauschbarkeit

Alles über eine deklarative Konfiguration:

```yaml
capabilities:
  speech_in:  { adapter: vosk,    mode: local }
  speech_out: { adapter: piper,   mode: local }
  intent:     { adapter: rules,   mode: local }
  ocr:        { adapter: tesseract, mode: local }
  detector:   { adapter: yolo_x,  mode: local }
  depth:      { adapter: depth_anything, mode: local, enabled: false }
  localizer:  { adapter: marker_vio, mode: local }
  vlm:        { adapter: none }      # optional: ollama/qwen2.5-vl
```

Derselbe Port kann lokal oder remote angebunden werden
(Siehe [14-lokal-vs-server.md](14-lokal-vs-server.md)).

## 9. Ort-generische Abstraktion

```
LocationProfile (z.B. "supermarkt", "bahnhof", "museum")
  ├── Map (Graph + Zonen + Anker)
  ├── ObjectCatalog (Produkte / Exponate / Ziele)
  ├── GuidanceVocabulary (sprachliche Templates)
  └── SafetyPolicy (was darf gesagt werden)
```

Die Kernmodule kennen keine Supermarkt-Spezifika. Ein neuer Ort = neues Profil
plus passende Katalog-/Kartenquelle. Der Supermarkt ist das erste Profil.

## 10. Technologie-Rahmen

- **Client:** PWA (TypeScript), optional später Capacitor oder native Android
  für tiefere Sensor-/Kameranutzung.
- **Optionale Server-Dienste:** Python (FastAPI) oder Rust, containerisiert via Docker,
  nur für rechenintensive VLM/ASR-Aufgaben.
- **Kommunikation Client↔Server:** WebSocket/REST, immer mit lokalem Fallback.
- **Alle Module** hinter Sprach-neutralen Interfaces (TypeScript-Protokolle im
  Client, Python-`Protocol`/ABC im Backend), serialisiert über JSON/Protobuf.
