# 13 – Reale technische Grenzen heutiger Smartphone-Hardware

Dieses Dokument beschreibt, was aktuelle Consumer-Smartphones realistisch
leisten – und welche Grenzen die Architektur berücksichtigen muss.

## 1. Kamera

| Eigenschaft | Realität | Konsequenz |
|-------------|----------|------------|
| Auflösung/Framerate | 1080p @ 30 fps typisch; höher = mehr Strom | 720p/1080p bei 10–15 fps für Vision reicht oft |
| Rolling Shutter | Verzerrung bei Bewegung | VIO/Detektion müssen das einkalkulieren |
| Belichtung/Autofokus | sucht bei Regalwechsel, Spiegelungen | Erkennung braucht Stabilisierung und Retry |
| Weitwinkel-Option | begrenztes FOV | Nahbereich am Regal schwierig |
| Licht | Supermärkte wechselhaft, Reflexionen | OCR auf Verpackung oft unzuverlässig |

## 2. Tiefensensorik

- Die meisten Geräte haben **kein LiDAR/ToF**. Time-of-Flight gibt es nur in
  einzelnen Pro-Modellen; ARCore-Depth auf ausgewählten Geräten.
- **Monokulare Tiefe** (MiDaS/Depth Anything) liefert relative Tiefe, keine
  verlässlichen metrischen Abstände in unbekannten Szenen.
- **Folge:** Abstände nur als Schätzung + Bestätigungsdialog; keine
  Sicherheitsaussage.

## 3. IMU

- Gyroskop/Beschleunigungssensor vorhanden, aber rauschend und driftend.
- VIO fusioniert Kamera + IMU und ist für kurze Strecken brauchbar,
  driftet aber ohne Relokalisierung.
- Magnetometer ist in Gebäuden unzuverlässig.

## 4. Positionierung

- **Kein GNSS indoor.** WLAN/BLE-Positionierung nur mit Infrastruktur und
  dann meist auf 3–10 m genau – für Regalgenauigkeit zu ungenau.
- Ohne Marker/VIO + Karte keine brauchbare Grobposition.

## 5. Rechenleistung

| Ressource | Realität | Konsequenz |
|-----------|----------|------------|
| NPU | Snapdragon Hexagon, Google Tensor u. a. – aber inkonsistente APIs | Adapter für NNAPI/ONNX Runtime; Fallback CPU |
| GPU (Web) | WebGPU noch uneinheitlich/limitiert | WebGL/CPU-Fallback einplanen |
| CPU | mobile Kerne, thermal begrenzt | kleine Modelle, Duty-Cycling |
| RAM | viele Geräte 4–8 GB | ein großes Vision-/VLM-Modell sprengt Budgets |

- **On-Device-VLM** ist nur mit sehr kleinen Modellen (SmolVLM, Moondream)
  und reduzierter Qualität möglich – oder gar nicht.
- Klassische CV schlägt hier große Modelle bei Effizienz und Nachvollziehbarkeit.

## 6. Energie und Thermik

- Dauerhafte Kamera + Inferenz erwärmt das Gerät und drosselt Leistung.
- Akkuverbrauch ist der Praxis-Killer für lange Einkäufe mit offener Kamera.
- **Gegenmaßnahmen:** Kamera nur in aktiven Phasen, reduzierte Framerate,
  Sensor-Fusion statt Dauer-Video, klare Pausen/Standby.

## 7. Audio

- Mikrofonqualität und -position variieren stark.
- Fernfeld-Spracherkennung im lauten, halligen Supermarkt ist unzuverlässig.
- Gespräche stören sich mit laufender eigener TTS und Screenreader.
- **Push-to-talk** und klare Interaktionsfenster sind robuster als Dauer-Zuhören.

## 8. Plattform-Beschränkungen

| Bereich | Android/Chrome | iOS/Safari |
|---------|----------------|-----------|
| WebXR / AR | besser unterstützt | kaum/kein WebXR-AR |
| Hintergrund-Kamera | eingeschränkt | stark eingeschränkt |
| PWA-Fähigkeiten | gut | restriktiver |
| Sensorzugriff im Web | teils eingeschränkt | sehr eingeschränkt |
| TTS-Steuerung | gut | eingeschränkter |

**Folge:** Android/PWA ist der realistische Start. iOS braucht später ggf.
eine native oder hybride App (Capacitor/Flutter).

## 9. Speicher und Offline

- Modelle, Karten und Kataloge müssen offline vorliegen, konkurrieren aber
  um begrenzten Speicher.
- Große VLM-/SLAM-Modelle sind offline oft nicht sinnvoll tragbar.
- **Priorisierung:** STT, TTS, OCR, Karte, Katalog offline; VLM optional online.

## 10. Konsequenzen für das Design

1. **Kleinste ausreichende Modelle** pro Aufgabe, Duty-Cycling.
2. **Klassische Algorithmen zuerst** (CV, OCR, A*) – effizient und erklärbar.
3. **Konfidenz statt Perfektion**, ehrliche Unsicherheit.
4. **Push-to-talk** statt Dauerhören.
5. **Marker im MVP**, Relokalisierung erst wenn robust machbar.
6. **Android first**, iOS als eigener Meilenstein mit realistischen Erwartungen.
