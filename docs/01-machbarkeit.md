# 01 – Technische Machbarkeitsanalyse

> **MVP-Hinweis:** Der MVP reduziert den Umfang auf die geschlossene
> Perception-Guidance-Schleife (siehe [15-mvp-priority.md](15-mvp-priority.md)).
> Grobnavigation, Karten und SLAM werden darin bewusst **nicht** benötigt.
> Die Analyse unten bleibt als Kontext für die späteren Erweiterungen bestehen.

Ziel dieses Dokuments ist eine ehrliche Einschätzung, was mit heutiger
Consumer-Smartphone-Hardware tatsächlich erreichbar ist – getrennt nach
Grobnavigation, Feinpositionierung und Sicherheit.

## 1. Kurzfazit

| Teilziel | Machbarkeit heute | Anmerkung |
|----------|-------------------|-----------|
| Spracheingabe verstehen | **Hoch** | On-Device-STT gut genug, Online-Fallback noch besser |
| Artikel semantisch identifizieren | **Hoch** | Intents sind eng; regelbasiert + Fuzzy/Embeddings |
| Position im Laden grob bestimmen | **Mittel** | Ohne Infrastruktur nur über Marker/Karten-Relokalisierung |
| Route zum Gang/Regal | **Hoch** | Deterministischer Graph + A*, sobald Position bekannt |
| Sprachführung dorthin | **Hoch** | Technisch einfach, Qualität hängt an Positionsgüte |
| Hinderniserkennung/-warnung | **Niedrig–Mittel** | Monokulare Tiefe unzuverlässig, keine Garantie |
| Konkretes Produkt visuell exakt erkennen | **Niedrig** | Offenes SKU-Erkennungsproblem; Barcode/OCR sind der pragmatische Weg |
| Feinpositionierung am Regal | **Mittel** | Über OCR/Barcode + bekannte Regalgeometrie, nicht über freie 3D-Vision |
| Sichere autonome Navigation | **Nicht garantiert** | Rechtlich und technisch nicht zusicherbar, darf nicht behauptet werden |

**Kernaussage:** Der Nutzen liegt nicht in „autonomer Navigation“, sondern in
**verlässlicher Orientierung und Rückmeldung** („Du bist in Gang 4“, „Das Produkt
ist im zweiten Regal von unten“) plus **ehrlicher Unsicherheitskommunikation**.

## 2. Analyse je Teilbereich

### 2.1 Speech-to-Text (STT)
- On-Device-Modelle (Whisper-tiny/base via whisper.cpp oder ONNX, Vosk, sherpa-onnx,
  Web-Speech-API auf Android) liefern für kurze, domänennahe Kommandos ausreichende
  Qualität (Wortfehlerrate im niedrigen zweistelligen Bereich bei ruhiger Umgebung).
- **Problem im Supermarkt:** Hintergrundgeräusche, Musik, Durchsagen, Hall, mehrere
  Sprecher. Fernfeld-Erkennung ist der schwierigste Teil.
- **Konsequenz:** Push-to-talk (expliziter Aufnahme-Start) statt Dauer-Zuhören im MVP;
  Schlüsselwörter per Grammatik/Keyword-Spotting; anschließend optional Cloud-ASR.
- **Bewertung: hoch** für Kommandos, **mittel** für freies Diktat in Lärm.

### 2.2 Text-to-Speech (TTS)
- Lokal (Piper, eSpeak NG, Android-TTS-Engine) gut und latenzarm.
- Konflikt mit Screenreader-Ausgabe (TalkBack/VoiceOver) muss aktiv gelöst werden
  (eigene Ansagen vs. Screenreader-Fokusreihenfolge).
- **Bewertung: hoch.**

### 2.3 Intent-Erkennung
- Der Raum der Äußerungen ist klein („suche X“, „wo ist X“, „abbrechen“, „stopp“,
  „nochmal“). Regelbasierte Slots + Fuzzy-Matching auf Produktkatalog sind robuster
  und erklärbarer als ein LLM.
- LLM/Embeddings nur als Fallback für ungewöhnliche Formulierungen.
- **Bewertung: hoch.**

### 2.4 Objekt- und Produkterkennung
- Allgemeine Objekterkennung (Regal, Einkaufswagen, Person, Boden) ist mit
  Mobile-Detektoren (YOLOX/FastSAM/MediaPipe) machbar, aber rechenintensiv.
- **Produkterkennung im engeren Sinn ist das Kernproblem:** zehntausende SKUs,
  ähnliche Verpackungen, Spiegelungen, Verdeckung, wechselnde Beleuchtung.
  Amazon-Go-artige Erkennung basiert auf *Shelf-Sensorik plus vielen Kameras*,
  nicht auf einem Smartphone.
- **Pragmatischer Weg:** Barcode (ZXing) + OCR des Regaletiketts/Preisschilds +
  Abgleich mit Produktdatenbank (GTIN → Produkt). Visuelle Wiedererkennung
  (Embedding-Matching) erst als Ergänzung, wenn Referenzbilder vorhanden sind.
- **Bewertung: niedrig** für freie visuelle SKU-Erkennung, **hoch** für
  Barcode/OCR-vermittelte Identifikation.

### 2.5 Visuelle Lokalisierung / Visual SLAM
- Smartphones liefern Kamera + IMU (Beschleunigung, Gyro) → visuell-inertiale
  Odometrie (VIO) ist das Fundament (ARCore/ARKit bzw. OpenVINS/RTAB-Map).
- **Problem:** Drift und Relokalisierung ohne vorab kartierte Umgebung. Indoor
  steht kein GNSS zur Verfügung.
- **Pragmatisch:** vorab erstellte Ladenkarte + wenige **Fiducial-Marker**
  (AprilTag/ArUco) an Regalenden → robuste Reset-/Ankerpunkte; dazwischen
  Dead-Reckoning/VIO als Überbrückung.

### 2.6 Indoor-Navigation
- Deterministisch: Laden graph modellieren (Zonen, Gänge, Regalreihen, Querverbindungen),
  A*/Dijkstra, Weg via Sprachschritte und Haptik ausgeben.
- Ohne Positionierung keine Navigation → Lokalisierung ist der kritische Pfad.
- **Bewertung: hoch**, sobald Position vorliegt.

### 2.7 Hinderniserkennung & Tiefenschätzung
- Monokulare metrische Tiefe (MiDaS/Depth Anything) ist relativ gut für Layout,
  aber **nicht metrisch zuverlässig** und ohne Garantie.
- Phones haben i. d. R. kein LiDAR (Ausnahme: einige Pro-Modelle).
- **Konsequenz:** Hinderniswarnung nur als „möglicherweise“-Hinweis, nie als
  Navigationsfreigabe. **Bewertung: niedrig–mittel.**

### 2.8 Feinpositionierung
- Kombination aus erkannter Regalstruktur (horizontale Ebenen), OCR/Barcode,
  grober Tiefe und Nutzerdialog („weiter nach rechts“, „jetzt“).
- Verlässlicher als freie 3D-Schätzung ist ein **bestätigungsbasierter Dialog**.
- **Bewertung: mittel.**

## 3. Was heute realistisch geht (Kern)

1. Spracheingabe + Intent + Produktkatalog-Auflösung.
2. Ladenkarte + Marker-basierte Grobposition → Gang/Regal.
3. Deterministische Route + Sprach-/Haptikführung.
4. Am Regal: OCR/Barcode → Produktbestätigung + grobe Feinweisung.
5. Durchgängige Unsicherheits- und Sicherheitskommunikation.

## 4. Was heute nicht verlässlich geht

- Garantierte Kollisionsvermeidung und sichere autonome Fortbewegung.
- Exakte Position auf Zentimeter ohne Infrastruktur/Marker.
- Freie visuelle Erkennung beliebiger SKUs ohne Barcode/OCR.
- Vollständig offline nutzbare Freitext-VLM-Fähigkeiten auf günstigen Geräten.

## 5. Abhängigkeiten und Prämissen

- **Ladenkarten sind die Voraussetzung.** Ohne gepflegte Karte (selbst erstellt
  oder aus OpenStreetMap) ist Grobnavigation nicht möglich.
- **Marker/Absicherung** sind im MVP akzeptabel und werden später durch
  Karten-Relokalisierung reduziert.
- **Sicherheit ist ein Nicht-Ziel als Garantie** – Formulierungen müssen das
  widerspiegeln (siehe [08-risiken.md](08-risiken.md)).
