# 05 – Roadmap: MVP → Prototyp → Praxistaugliche Version

Zeithorizonte sind grob und dienen der Planung, nicht als Zusage.

## Phase 0 – Fundament (Wochen 0–4)

- Repository, Lizenz, ADRs, CI-Grundgerüst.
- Definition der Ports/Interfaces + Event-Bus + Konfidenzmodell.
- Accessibility-Grundlagen: ARIA-Dialogschicht, Fokusmanagement, TalkBack-Test-Setup.
- Kartierungswerkzeug (Minimalversion) + Testmarkt-Datenmodell.
- **Exit:** Walking Skeleton: Text-Query → Ansage „Gang X“ mit statischer Karte.

## Phase 1 – MVP (Monate 1–4)

- Push-to-talk STT lokal, regelbasiertes Intent, Fuzzy-Katalog.
- Marker-basierte Groblokalisierung + Dead-Reckoning.
- A*-Navigation + Sprach-/Haptikführung.
- OCR/Barcode am Regal + bestätigungsbasierte Feinpositionierung.
- Safety Supervisor + vollständige Unsicherheitskommunikation.
- Offline-Cache für einen Markt.
- **Exit:** Erfolgskriterien aus [04-mvp.md](04-mvp.md) erreicht (Testmarkt, ≥1 Testperson).

## Phase 2 – Prototyp (Monate 5–10)

- **Lokalisierung verbessern:** VIO-Relokalisierung gegen visuelle Karte,
  Marker nur initial; Lost-Recovery.
- **Mehrere Märkte:** Kartierungs-Pipeline, Crowdsourcing-Import (OSM Indoor).
- **Katalog:** Open Food Facts anbinden, lokaler Cache, Händler-Feed-Adapter.
- **Regalerkennung** robuster (klassische CV + optionaler Detektor).
- **VLM optional** als Server-Adapter für „Was steht hier?“.
- **iOS:** Machbarkeitsprüfung (WebXR-/Safari-Limits), ggf. Capacitor/nativ.
- **Accessibility:** automatisierte axe-Tests in CI, weitere Screenreader, Nutzendentests.
- **Exit:** Nutzbar in ≥3 realen Märkten mit vertretbarer Fehlerrate, dokumentierte Grenzen.

## Phase 3 – Praxistauglich (Monate 11–18+)

- **Robuste Lokalisierung** ohne Ladeninfrastruktur (Karten-Relokalisierung, Multi-Sensor-Fusion).
- **Hinderniswarnung** als klar gekennzeichneter Beta-Hinweis (nie als Garantie).
- **Produkt-Wiedererkennung** über Referenzbilder/Embeddings als Ergänzung zu Barcode/OCR.
- **Händler-Integration** (Regalpläne, Bestände) über offene Adapter.
- **Weitere Orte** über `LocationProfile` (Bahnhof, Flughafen, Behörde, Klinik, Museum).
- **Barrierefreiheit & Regulatorik:** EN 301 549 / BITV-Nachweis, EU-AI-Act-Bewertung,
  ggf. medizinproduktrechtliche Prüfung falls Sicherheitsversprechen entstehen.
- **Nachhaltigkeit:** Governance, Maintainer, Release-Prozess, Finanzierung.
- **Exit:** Wartbare Open-Source-Plattform, mehrere Orte, dokumentierte Betriebs- und
  Sicherheitsgrenzen.

## Querschnittsaufgaben (laufend)

| Aufgabe | Ab Phase |
|---------|----------|
| Teststrategie & Datensätze | 0 |
| Accessibility-Tests (auto + manuell + Nutzende) | 0 |
| Sicherheits-/Unsicherheits-Audit | 1 |
| Lizenz- und Modell-Audit | 0 |
| Datenschutz-Folgenabschätzung (DPIA) | 1 |
| Performance-/Akku-Profiling | 1 |
| Dokumentation & ADRs | 0 |

## Meilenstein-Übersicht

| Meilenstein | Ergebnis |
|-------------|----------|
| M0 Walking Skeleton | statische Route + Ansage |
| M1 MVP | Testmarkt End-to-End, Messbericht |
| M2 Prototyp | 3 Märkte, VLM optional, iOS geprüft |
| M3 Praxis | Lokalisierung ohne Infrastruktur, weitere Orte, Compliance |
