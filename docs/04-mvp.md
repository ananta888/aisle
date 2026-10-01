# 04 – Realistischer MVP

> **Revision (2026-10-01):** Maßgeblich ist jetzt
> [15-mvp-priority.md](15-mvp-priority.md). Der MVP ist die **geschlossene
> Wahrnehmungs-Führungs-Schleife** (Sprachwunsch → Live-Kamera →
> Produkterkennung → gesprochene Führung). Die ursprünglich hier beschriebene
> Fassung mit **Ladenkarte, Marker-Lokalisierung und Grobnavigation ist auf
> „später“ verschoben** (siehe `todos/research/` und `todos/backlog/`).
> Elemente, die Karten/SLAM/Routing voraussetzen, sind **kein MVP-Scope**.
>
> Der folgende Text bleibt als Planungshistorie erhalten; die Scope-Listen
> unter §2/§3 gelten nur für die **erweiterte** Version nach Erreichen des
> MVP-Acceptance-Goals.

Der MVP ist bewusst **kein autonomer Roboter-Ersatz**, sondern ein
verlässlicher, ehrlicher Sprachbegleiter für **einen Test-Supermarkt**.

## 1. MVP-Ziel

> Eine blinde Testperson betritt einen bekannten Testmarkt, sagt „Ich suche
> Hafermilch“, wird per Sprache zu einem definierten Gang/Regal geführt und
> erhält dort eine grobe Positionshilfe, die sie durch Barcode/OCR bestätigen kann.

## 2. Verbindlicher Scope (In)

1. **Spracheingabe** per Push-to-talk (Taste/Doppeltipp), lokales STT für kurze Kommandos.
2. **Intent + Produktauflösung** für eine feste Kategorie-/Produktliste des Testmarkts.
3. **Ladenkarte** als manuell erstellter Graph (Editor oder JSON) für genau einen Markt.
4. **Grobe Lokalisierung** über:
   - Startpunkt (Eingang, manuell/QR), und
   - AprilTag/ArUco-Marker an Regalenden, kombiniert mit einfachem Dead-Reckoning.
5. **Grobnavigation** (A*) und **Sprach-/Haptikführung** entlang der Route.
6. **Ankunft am Regal** → **OCR/Barcode** liest Produktname/-code.
   - Barcode vorhanden: GTIN → Katalog → Name.
   - Kein Barcode: OCR-Textabgleich mit Fuzzy-Matching.
7. **Feinpositionierung** als *bestätigungsbasierter Dialog*
   („Etwas nach rechts“, „Jetzt“), keine freie 3D-Schätzung.
8. **Safety Supervisor**: alle Unsicherheiten werden ausgesprochen.
9. **Accessibility**: Screenreader-Test mit TalkBack, ARIA, große Ziele, Sprachsteuerung
   vollständig, keine rein visuelle Information.
10. **Offline**: Karte, Modell, Katalog für den Testmarkt lokal verfügbar.

## 3. Expliziter Nicht-Scope

- Keine freie visuelle SKU-Erkennung ohne Barcode/OCR.
- Keine Hindernisgarantie, kein autonomes Ausweichen.
- Keine Cloud-Pflicht; kein Account-Zwang.
- Kein Mehrsprachigkeitsvollausbau (Start: Deutsch, Architektur mehrsprachig).
- Keine iOS-Unterstützung im MVP (Android/Chrome first).
- Keine Gesichtserkennung, keine Personendaten.

## 4. Erfolgskriterien (messbar)

| Kriterium | Zielwert |
|-----------|----------|
| STT-Kommandoerkennung in ruhiger Umgebung | ≥ 90 % korrekt |
| Intent+Produktauflösung für Testkatalog | ≥ 90 % korrekt |
| Grobposition nach Marker-Reset | Fehler < 2 m |
| Routenfindung im Testmarkt | 100 % (Graph bekannt) |
| Korrekte Gang-Ankunft (Selbstauskunft Testperson) | ≥ 80 % der Versuche |
| Barcode/OCR-Produktbestätigung | ≥ 85 % korrekt |
| Unsicherheitshinweise korrekt ausgesprochen | 100 % der Niedrig-Konfidenz-Fälle |
| Screenreader-Bedienbarkeit (TalkBack) | alle Kernschritte ohne Sicht möglich |
| Offline-Betrieb | Kernweg ohne Netz möglich |

## 5. Testmarkt-Anforderungen

- Zugang für Kartierung (auch außerhalb der Öffnungszeiten).
- Einwilligung zur Marker-Anbringung (temporär, rückstandsfrei).
- Eine begrenzte, stabile Produktliste (z. B. 50–200 Artikel).
- Testperson(en) aus der Zielgruppe aktiv beteiligt.

## 6. Technischer Aufbau des MVP

```
Android/Chrome PWA
  ├─ Kamera (getUserMedia) + IMU
  ├─ Vosk / Web Speech (STT)
  ├─ Piper / Android TTS (TTS)
  ├─ Regelbasiertes Intent + Fuzzy-Katalog
  ├─ ArUco/AprilTag (OpenCV.js) → Pose-Reset
  ├─ Dead-Reckoning-Überbrückung
  ├─ A* über lokale JSON-Karte
  ├─ Tesseract.js (OCR) + ZXing (Barcode)
  └─ Safety Supervisor + ARIA-Dialogschicht
Backend: keines erforderlich (optional Docker für größeres STT/VLM)
```

## 7. Offene MVP-Fragen (zu entscheiden)

- PWA vs. frühe native Android-App (Kamera-/Sensorzugriff, Hintergrund, TTS-Steuerung).
- Marker-Sichtbarkeit vs. Akzeptanz im Laden.
- Wie wird „Ankunft im richtigen Gang“ ohne feines Depth zuverlässig bestätigt?
- Umgang mit TalkBack + eigener TTS (Priorität, Unterbrechung, Fokus).
- Wird Open Food Facts (ODbL) bereits im MVP genutzt oder erst später?

## 8. MVP-Deliverables

- Funktionierender End-to-End-Pfad für den Testmarkt.
- Kartierungs-/Exportwerkzeug (einfachste Form).
- Dokumentierte Accessibility-Prüfung (axe + manueller Screenreader-Durchlauf).
- Messbericht gegen die Erfolgskriterien.
