# A.I.S.L.E.

**Accessible Intelligent Shopping & Location Explorer**

Eine offene, barrierefreie und sprachgesteuerte Assistenz-Plattform zur visuellen
Navigation und Produktsuche – zuerst für blinde und stark sehbehinderte Menschen
im Supermarkt, langfristig für weitere öffentliche Orte.

> **Status: Konzeptphase.** Es existiert noch kein lauffähiger Code.
> Dieses Repository enthält derzeit ausschließlich Analyse-, Architektur- und
> Planungsdokumente. Bitte keine Implementierung ohne abgeschlossene MVP-Planung.

## Idee in einem Satz

Ein Nutzer sagt „Ich suche Hafermilch“ – das Smartphone hört zu, erkennt die
Umgebung über die Kamera, bestimmt die Position im Geschäft, führt per Sprache
zum richtigen Gang und unterstützt am Regal bei der Feinpositionierung des
konkreten Produkts.

## Grundprinzipien

- **Mobile-first**, Android zuerst, iOS perspektivisch, bevorzugt PWA / hybride Architektur.
- **Barrierefrei von Anfang an**: WCAG 2.2 AA, WAI-ARIA, vollständige Sprachbedienung,
  Screenreader-Kompatibilität, große Bedienelemente, keine rein visuelle Information.
- **Hybrid, nicht KI-gläubig**: klassische Computer Vision, SLAM, OCR und deterministische
  Navigation zuerst; KI/VLM/LLM nur, wo semantisches Verständnis echten Mehrwert bringt.
- **Lokal zuerst**: lokale Modelle und On-Device-Verarbeitung bevorzugt; Cloud-APIs optional
  und austauschbar.
- **Datenschutz by Design**: keine Speicherung von Kamera-/Audiodaten, keine Gesichtserkennung,
  keine unnötige personenbezogene Datenerfassung.
- **Sicherheit vor Autonomie**: Das System garantiert niemals sichere Hindernisnavigation.
  Unsicherheit wird explizit kommuniziert.
- **Modular & offen**: austauschbare Modelle hinter stabilen Interfaces, wenig Vendor Lock-in,
  permissive Lizenz.

## Dokumentation

| Nr. | Thema | Datei |
|-----|-------|-------|
| 01 | Technische Machbarkeitsanalyse | [docs/01-machbarkeit.md](docs/01-machbarkeit.md) |
| 02 | Gesamtarchitektur | [docs/02-architektur.md](docs/02-architektur.md) |
| 03 | Modulaufteilung | [docs/03-module.md](docs/03-module.md) |
| 04 | Realistischer MVP | [docs/04-mvp.md](docs/04-mvp.md) |
| 05 | Roadmap MVP → Prototyp → Praxis | [docs/05-roadmap.md](docs/05-roadmap.md) |
| 06 | Open-Source-Technologien & Modelle | [docs/06-technologien.md](docs/06-technologien.md) |
| 07 | Wiederverwendbare bestehende Projekte | [docs/07-vorhandene-projekte.md](docs/07-vorhandene-projekte.md) |
| 08 | Risikoanalyse | [docs/08-risiken.md](docs/08-risiken.md) |
| 09 | Datenschutz & Accessibility | [docs/09-datenschutz-accessibility.md](docs/09-datenschutz-accessibility.md) |
| 10 | Repository-Struktur | [docs/10-repository-struktur.md](docs/10-repository-struktur.md) |
| 11 | API- & Komponentenstruktur | [docs/11-api-komponenten.md](docs/11-api-komponenten.md) |
| 12 | Teststrategie | [docs/12-teststrategie.md](docs/12-teststrategie.md) |
| 13 | Reale Hardware-Grenzen | [docs/13-hardware-grenzen.md](docs/13-hardware-grenzen.md) |
| 14 | Lokal vs. Server/VLM | [docs/14-lokal-vs-server.md](docs/14-lokal-vs-server.md) |
| 15 | **MVP Priority (autoritativ)** | [docs/15-mvp-priority.md](docs/15-mvp-priority.md) |
| 16 | Vision-Provider (llama.cpp-vision-decision, Jev-Modus) | [docs/16-vision-provider-jev.md](docs/16-vision-provider-jev.md) |
| 17 | Speech-Provider (whisper.cpp-audio-decision) | [docs/17-whisper-decision-speech.md](docs/17-whisper-decision-speech.md) |
| 18 | Lokales TTS (Dragon-Voice/Piper) | [docs/18-local-tts-dragon-voice.md](docs/18-local-tts-dragon-voice.md) |

> **MVP-Fokus:** Die erste Version ist die geschlossene
> Wahrnehmungs-Führungs-Schleife (Sprache → Live-Kamera → Produkterkennung →
> gesprochene Führung). Karten, SLAM, Routing, Händler-APIs und Bestände sind
> ausdrücklich **spätere Erweiterungen** – siehe
> [docs/15-mvp-priority.md](docs/15-mvp-priority.md).

## Lizenz

Der Quellcode steht unter der **BSD 3-Clause License**
(siehe [LICENSE](LICENSE), Copyright (c) 2026, Peter Stuiber). Entscheidung:
[adr/0003-lizenz-bsd-3-clause.md](adr/0003-lizenz-bsd-3-clause.md).

Für Modelle, Bibliotheken und Daten gelten deren jeweilige Lizenzen; die
Auswahl und das Lizenzaudit werden in
[docs/06-technologien.md](docs/06-technologien.md) und
[docs/08-risiken.md](docs/08-risiken.md) dokumentiert.

A.I.S.L.E. ist ein **Assistenzsystem**, kein Sicherheitssystem: es unterstützt
die Orientierung, garantiert aber keine sichere Hindernisnavigation.

## Beitragen

Siehe `CONTRIBUTING.md` (geplant). In der Konzeptphase sind vor allem
Review, Accessibility-Feedback von betroffenen Nutzenden und fachliche
Expertise zu Indoor-Navigation und Computer Vision willkommen.
