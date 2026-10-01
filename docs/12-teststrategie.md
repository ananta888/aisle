# 12 – Teststrategie

Testen hat hier drei gleichrangige Ziele: **Korrektheit**, **Barrierefreiheit**
und **Sicherheit/Unsicherheit**. Alle drei sind Teil der Definition of Done.

## 1. Testpyramide

```
        ┌─────────────────────┐
        │  Feldtests / Nutzer │  (manuell, Zielgruppe, real)
        ├─────────────────────┤
        │  E2E / Integration  │  (Playwright, Appium)
        ├─────────────────────┤
        │  Modul-/Modelleval  │  (pytest, Benchmarking)
        ├─────────────────────┤
        │  Unit-Tests         │  (schnell, viel)
        └─────────────────────┘
   quer: Accessibility-Tests + Sicherheits-/Unsicherheits-Audits
```

## 2. Unit-Tests

- Alle Ports/Kernlogik mit **Dummy-Adaptern** (deterministisch, keine Modelle).
- Besonders kritisch: Konfidenzschwellen, Zustandsautomat, Safety-Downgrades,
  Pfadplanung, Produkt-Fuzzy-Matching, Template-Erzeugung.
- Erwartung: schnelle Ausführung, hohe Abdeckung der Kernlogik.

## 3. Modul- und Modellevaluation (`eval/`)

Jedes Modell hat einen **festen Evaluationsdatensatz** und Schwellenwerte.
Wird ein Schwellenwert unterschritten, gilt der Adapter als nicht freigabefähig.

| Modul | Metrik | Beispiel-Schwelle |
|-------|--------|-------------------|
| STT | Wortfehlerrate (WER) | < 15 % (ruhig), < 35 % (Markt) |
| Intent | Accuracy | > 95 % Testkommandos |
| Produktauflösung | Top-1 / Top-3 | > 90 % / > 98 % |
| OCR | Zeichenfehlerrate (CER) | < 10 % auf Regaletiketten |
| Barcode | Erkennungsrate | > 90 % bei mittlerem Abstand |
| Detektion | mAP (relevant) | projektspezifisch definiert |
| Tiefe | relativer Fehler | nur relativ bewertet |
| Lokalisierung | Positionsfehler | < 2 m (MVP-Marker) |
| Feinposition | Trefferquote horizontal | > 80 % |
| Navigation | Routenlänge vs. optimal | < 1,3× Optimal |

Datensätze: synthetisch + real (mit Einwilligung), **keine personenbezogenen
Rohdaten**, nur für Evaluationszwecke.

## 4. Integrationstests

- Zusammenspiel Orchestrator ↔ Ports mit simulierten Sensorströmen.
- Fehlerfälle: Modell-Ausfall, niedrige Konfidenz, Lokalisierungsverlust,
  Timeout, widersprüchliche Beobachtungen.
- Offline-Szenarien: Netz weg → lokaler Pfad muss funktionieren.

## 5. E2E-Tests

- **Web:** Playwright, mit Kamera-/Mikrofon-Mocks, deterministische Testkarten.
- **Mobile:** Appium auf Referenzgeräten.
- Szenarien:
  1. „Suche Hafermilch“ → korrekte Ansage → Route → Ankunft.
  2. Lokalisierung verloren → System sagt Unsicherheit an → Recovery.
  3. Produkt nicht gefunden → ehrliche Rückmeldung, kein Raten.
  4. Barcode erkannt → korrekter Produktname.
  5. „Stopp“ unterbricht sofort.
  6. Offline-Betrieb.

## 6. Accessibility-Tests

**Automatisiert (CI-Gate):**
- axe-core / pa11y auf allen Kernansichten.
- Lighthouse-Accessibility-Score als Mindestschwelle.
- Tests auf korrekte ARIA-Rollen, Live-Regionen, Fokusreihenfolge.

**Manuell (regelmäßig, verpflichtend):**
- Kernaufgaben ausschließlich per **TalkBack** (Android) und **VoiceOver** (iOS).
- Test mit Bildschirm aus / Augenbinde, um visuelle Abhängigkeiten aufzudecken.
- Prüfung der Sprachausgabe-Priorisierung gegen den Screenreader.
- Zoom, Großschrift, Kontrastmodus, `prefers-reduced-motion`.

**Mit Nutzenden:**
- Tests mit blinden und stark sehbehinderten Personen in realen Märkten
  (mindestens zu jedem Meilenstein).
- Qualitative Protokolle: Was war verwirrend? Wurde Unsicherheit verstanden?

## 7. Sicherheits- und Unsicherheits-Audits

- **Fuzzing der Dialoglogik:** Werden bei niedriger Konfidenz immer
  Unsicherheitshinweise erzeugt?
- **Formulierungsprüfung:** Automatisierter Test, dass keine Garantiephrasen
  („sicher“, „garantiert“, „du kannst gehen“) ungefiltert ausgegeben werden.
- **Szenario-Tests:** widersprüchliche Lokalisierung, Hindernis-Meldung,
  Sensorausfall.

## 8. Lizenz- und Datenschutztests

- **CI-Lizenzprüfung** (z. B. `reuse`/`license-checker`): blockiert AGPL/NC im Client.
- **Datenschutz-Unit-Tests:** Prüfen, dass Adapter im `local`-Modus keine
  Netzwerkaufrufe auslösen (z. B. via Netzwerk-Mocks).
- **Keine Persistenz:** Test, dass Kamera-/Audio-Puffer nach Verarbeitung frei sind.

## 9. Performance- und Langzeittests

- CPU/GPU/NPU-Last, Speicher, Akkuverbrauch über 30+ Minuten Dauerbetrieb.
- Thermik: Framerate/Qualität bei Erwärmung.
- Latenz der Kette STT → Intent → Ansage.

## 10. CI/CD

```
push/PR
  ├─ lint + typecheck
  ├─ unit-tests
  ├─ license-check        (Pflicht)
  ├─ a11y-tests (axe)     (Pflicht)
  ├─ integration-tests    (Dummy-Adapter)
  └─ build
release
  ├─ e2e-tests (Playwright/Appium)
  ├─ modelleval gegen Schwellenwerte
  └─ signierte Artefakte + SBOM
```

- **SBOM** (Software Bill of Materials) pro Release.
- **Reproduzierbare Builds** für Backend-Container.
- Feldtests werden manuell dokumentiert, nicht automatisiert.

## 11. Testdaten-Governance

- Nur synthetische oder ausdrücklich freigegebene Daten.
- Keine Gesichter, keine Kennzeichen, keine personenbezogenen Rohdaten.
- Datensätze versioniert in `eval/`, mit Herkunft und Lizenz dokumentiert.
