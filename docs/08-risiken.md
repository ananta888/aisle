# 08 – Risikoanalyse

Bewertung: Wahrscheinlichkeit (W) und Auswirkung (A) je 1–5, Risiko = W×A.
Priorität: **K**ritisch (≥15), **H**och (9–14), **M**ittel (4–8), **N**iedrig (<4).

## 1. Technische Risiken

| # | Risiko | W | A | R | Prio | Gegenmaßnahme |
|---|--------|---|---|---|------|---------------|
| T1 | Indoor-Lokalisierung ohne Infrastruktur unzuverlässig | 5 | 5 | 25 | K | Marker im MVP, Karten-Relokalisierung im Prototyp, Lost-Recovery, ehrliche Unsicherheit |
| T2 | Freie visuelle SKU-Erkennung scheitert | 5 | 4 | 20 | K | Nicht als MVP-Ziel; Barcode/OCR als Standardpfad |
| T3 | Monokulare Tiefe liefert keine metrischen Abstände | 4 | 4 | 16 | K | Relative Hinweise + Bestätigungsdialog, nie als Garantie |
| T4 | STT versagt im lauten Supermarkt | 4 | 4 | 16 | K | Push-to-talk, domänenspezifische Grammatik, Cloud-Fallback optional |
| T5 | Akku-/Thermik-Limit bei Dauer-Kamera + Inferenz | 4 | 3 | 12 | H | Duty-Cycling, kleine Modelle, Frame-Raten begrenzen |
| T6 | Latenz der Pipeline zu hoch für flüssige Führung | 3 | 4 | 12 | H | Asynchrone Pipeline, Priorisierung, lokale Kleinstmodelle |
| T7 | Kamerapose/Drift nach längerer Wegstrecke | 4 | 4 | 16 | K | Marker-Resets, VIO-Fusion, Konfidenz exponentiell dämpfen |
| T8 | Vielfalt an Geräten führt zu unterschiedlicher Qualität | 4 | 3 | 12 | H | Referenzgeräte, Mindestanforderungen, Fallbacks |
| T9 | Regalerkennung scheitert bei Sonderformaten | 4 | 3 | 12 | H | Nutzerdialog statt Automatik, OCR-Fallback |
| T10 | Modell-/Library-Lizenz verhindert Verteilung | 3 | 5 | 15 | K | Lizenzaudit vor Übernahme, AGPL/NC meiden (siehe 06) |

## 2. Sicherheits- und Haftungsrisiken

| # | Risiko | W | A | R | Prio | Gegenmaßnahme |
|---|--------|---|---|---|------|---------------|
| S1 | Nutzer verlässt sich auf „sichere“ Navigation und stürzt/ kollidiert | 4 | 5 | 20 | K | Safety Supervisor, explizite Nicht-Garantie, Warnformulierungen, kein Sicherheitsversprechen |
| S2 | Falsche Positionsangabe führt in die Irre | 5 | 4 | 20 | K | Konfidenzschwellen, „ich bin unsicher“-Zustände, Rückfragen |
| S3 | Rechtliche Einstufung als Medizinprodukt (MDR) bei Sicherheitsanspruch | 2 | 5 | 10 | H | Keine medizinische/sicherheitsgarantierende Aussage, Rechtsprüfung |
| S4 | Produkthaftung bei Schäden | 2 | 5 | 10 | H | Haftungsausschluss, klare Grenzen dokumentieren, Nutzendentests |
| S5 | EU-AI-Act-Einordnung (Transparenzpflichten) | 3 | 3 | 9 | H | Risikoklassifizierung dokumentieren, Transparenzhinweise |
| S6 | Falscher Alarm verunsichert / echter Alarm wird ignoriert | 3 | 4 | 12 | H | Klare, konsistente Signalhierarchie und Haptiksprache |

## 3. Datenschutzrisiken

| # | Risiko | W | A | R | Prio | Gegenmaßnahme |
|---|--------|---|---|---|------|---------------|
| P1 | Kamera/Audio verlässt Gerät unbeabsichtigt | 3 | 5 | 15 | K | Lokal-First, keine Persistenz, explizite Opt-ins, kein Auto-Upload |
| P2 | Personen werden mitgefilmt/erkannt | 4 | 4 | 16 | K | Keine Gesichtserkennung, flüchtige Verarbeitung, On-Device, keine Speicherung |
| P3 | Standort-/Bewegungsprofil entsteht | 3 | 4 | 12 | H | Keine Bewegungsprotokolle, nur flüchtige Zustände |
| P4 | Telemetrie de-anonymisierbar | 2 | 4 | 8 | M | Opt-in, Aggregation, keine Rohdaten |
| P5 | Drittanbieter-Modelle/Cloud geben Daten weiter | 3 | 4 | 12 | H | Standard lokal, Cloud nur optional, klare Anzeige, austauschbar |

## 4. Accessibility-Risiken

| # | Risiko | W | A | R | Prio | Gegenmaßnahme |
|---|--------|---|---|---|------|---------------|
| A1 | Eigene TTS kollidiert mit Screenreader | 4 | 4 | 16 | K | Konfliktstrategie, Modi (Screenreader-geführt vs. App-geführt), Tests |
| A2 | Bedienung doch visuell vorausgesetzt | 3 | 5 | 15 | K | „Kein rein visuelles Element“, Voice-first, Tastatur, Fokuslogik |
| A3 | Zu komplexe Sprache/Kognition | 3 | 4 | 12 | H | Einfache, konsistente Sätze (Wayfindr-Stil), kurze Schritte |
| A4 | Unzureichende Nutzendentests | 3 | 5 | 15 | K | Betroffene von Anfang an einbeziehen, regelmäßige Feldtests |
| A5 | Falsches Vertrauen in Anweisungen | 3 | 4 | 12 | H | Unsicherheit hörbar machen, nie übertreiben |

## 5. Projekt-/Organisationsrisiken

| # | Risiko | W | A | R | Prio | Gegenmaßnahme |
|---|--------|---|---|---|------|---------------|---------------|
| O1 | Überambitionierter Scope, kein Fortschritt | 4 | 4 | 16 | K | Harter MVP-Scope, Nicht-Ziele, messbare Kriterien |
| O2 | Zu wenige Beiträge/Wartung | 4 | 4 | 16 | K | Gute Doku, ADRs, „good first issues“, klare Governance |
| O3 | Abhängigkeit von einer Person | 4 | 4 | 16 | K | Bus-Faktor senken, Co-Maintainer, CI-Automatisierung |
| O4 | Keine Testmärkte/Testpersonen | 3 | 5 | 15 | K | Früh Kooperationen mit Verbänden/Märkten suchen |
| O5 | Händler-Kooperation scheitert | 4 | 3 | 12 | H | Ohne Händler funktionieren (Karte selbst kartieren) |
| O6 | Finanzierung/Nachhaltigkeit | 4 | 4 | 16 | K | Förderungen, Stiftungen, Open-Source-Fördermodelle prüfen |

## 6. Top-Risiken (sofort adressieren)

1. **T1/T7 – Lokalisierung** ist der kritische Pfad. Ohne tragfähige Lösung
   ist Grobnavigation nicht möglich. → MVP auf Marker begrenzen.
2. **S1/S2 – Sicherheit/Vertrauen.** Falsche Sicherheit ist gefährlicher als
   fehlende Funktion. → Safety Supervisor als Kernarchitektur.
3. **T2/T10 – SKU + Lizenzen.** Falsche Technologie-/Lizenzwahl blockiert
   Verteilung. → Barcode/OCR-Pfad, Lizenzaudit in CI-Pflicht.
4. **A1/A4 – Screenreader + Nutzendentests.** Zweck des Projekts. → frühe,
   kontinuierliche Einbindung.

## 7. Restrisiko-Aussage

Selbst bei Umsetzung aller Maßnahmen bleibt ein **Restrisiko**:
A.I.S.L.E. ist ein **Assistenz**system, kein Sicherheitssystem. Diese Aussage
muss in UI, Doku und Sprachausgabe konsistent wiederholt werden.
