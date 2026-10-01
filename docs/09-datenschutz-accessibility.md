# 09 – Datenschutz- und Accessibility-Anforderungen

## Teil A – Datenschutz by Design

### A.1 Grundsätze

1. **Datenminimierung.** Nur verarbeiten, was für die aktuelle Funktion nötig ist.
2. **Lokalität.** Verarbeitung bevorzugt auf dem Gerät, flüchtig im RAM.
3. **Keine Persistenz von Rohdaten.** Kamera-/Audiodaten werden nicht gespeichert.
4. **Kein Auto-Upload.** Cloud nur nach ausdrücklicher, situativer Bestätigung.
5. **Keine Gesichtserkennung.** Nicht als Feature, nicht als Voraussetzung.
6. **Keine personenbezogene Erfassung.** Keine Profile, kein Tracking, keine Werbe-IDs.
7. **Transparenz.** Jede Datenflut ist sichtbar und abschaltbar.
8. **Austauschbarkeit.** Externe Dienste sind Adapter, keine Voraussetzung.

### A.2 Technische Umsetzung

| Anforderung | Umsetzung |
|-------------|-----------|
| Flüchtige Verarbeitung | In-Memory-Puffer, kein Schreiben auf Speicher/Dateisystem |
| Keine Rohdatenspeicherung | Kamera/Audio-Frames werden nach Verarbeitung verworfen |
| Kein Auto-Cloud | Cloud-Adapter standardmäßig aus, expliziter Opt-in pro Nutzung |
| Kein Account-Zwang | Kernfunktion ohne Login nutzbar |
| Standort | Kein GNSS-Tracking; Position nur flüchtig für Navigation |
| Telemetrie | Opt-in, aggregiert, ohne Rohdaten, jederzeit abstellbar |
| Permissions | Kamera/Mikro nur bei Bedarf, jederzeit widerrufbar, Erklärung in einfacher Sprache |
| Speicher | Nur Karten/Kataloge/Modelle; keine Nutzungsinhalte |

### A.3 Rechtlicher Rahmen (EU/DE)

- **DSGVO:** Rechtsgrundlage, Zweckbindung, Datenminimierung, Speicherbegrenzung,
  Betroffenenrechte. Für den Regelbetrieb voraussichtlich keine personenbezogenen
  Daten → dennoch **Datenschutz-Folgenabschätzung (DPIA)** als Vorsorge (Phase 2).
- **EU AI Act:** Risikoklassifizierung dokumentieren; Transparenzpflichten für
  KI-Ausgaben beachten; keine verbotenen Praktiken (keine biometrische
  Kategorisierung o. Ä.).
- **Barrierefreiheitsstärkungsgesetz / EAA (European Accessibility Act):**
  ab 2025 auch für viele Produkte/Dienste relevant – früh adressieren.
- **Keine medizinische Zweckbestimmung** ohne MDR-Prüfung. (Siehe Risiko S3.)

### A.4 Datenschutz-Checkliste pro Modul

- [ ] Verarbeitet das Modul personenbezogene Daten? Wenn ja: warum nötig?
- [ ] Verlässt ein Byte das Gerät? Wenn ja: wie sichtbar/abschaltbar?
- [ ] Wird etwas gespeichert? Wenn ja: wie lange, wo, löschbar?
- [ ] Gibt es eine lokale Alternative? Ist sie Standard?
- [ ] Ist die Datenflut für Nutzende in einfacher Sprache erklärt?

---

## Teil B – Accessibility-Anforderungen

### B.1 Standards und Zielniveau

| Standard | Ziel |
|----------|------|
| WCAG 2.2 | **AA** (mindestens), wo sinnvoll AAA |
| WAI-ARIA Authoring Practices | korrekte Muster |
| EN 301 549 | Konformität anstreben |
| BITV 2.0 | für öffentliche Einsatzfelder |
| Section 508 | für US-Kontext |

Vollständige Sprachbedienung ist **kein Zusatzfeature**, sondern der
primäre Interaktionsweg.

### B.2 Konkrete Anforderungen

**Wahrnehmbarkeit**
- Keine Information ausschließlich visuell; jede visuelle Info hat akustische
  und/oder haptische Entsprechung.
- Kontrast ≥ 4.5:1 (Text), ≥ 3:1 (UI-Komponenten), keine Farbe als einziges Signal.
- Skalierbare Schrift, Textalternativen, beschreibende Labels.
- Eigene Sprachausgabe unterbrechbar und priorisierbar.

**Bedienbarkeit**
- Vollständige Steuerung per Sprache, Tastatur und Switch/Assistenztechnik.
- Touch-Ziele ≥ 44×44 px (empfohlen 48×48), großzügige Abstände.
- Keine Gesten ohne Alternative; keine zeitkritischen Aktionen ohne Verlängerung.
- „Stopp“ muss jederzeit sofort funktionieren (auch per Sprache/Taste).
- Reduzierte Bewegung respektieren (`prefers-reduced-motion`).

**Verständlichkeit**
- Einfache, konsistente Sprache; kurze Sätze; vorhersehbare Struktur
  (angelehnt an den **Wayfindr-Standard**).
- Fehler werden verständlich erklärt und bieten Auswege.
- Konsistente Begriffe für Richtungen, Abstände und Zustände.

**Robustheit / Kompatibilität**
- Saubere semantische HTML-Struktur, korrekte Rollen und ARIA-Attribute.
- Live-Regionen mit angemessener `aria-live`-Politeness; keine Over-Announcements.
- Getestet mit **TalkBack (Android)**, **VoiceOver (iOS)**, **NVDA/JAWS** (Desktop).
- Funktioniert mit hohem Zoom, Kontrast-Modi, Großschrift.

### B.3 Konflikt Screenreader ↔ eigene Sprachausgabe

Ein zentrales, frühes Designproblem:
- **Modus „Screenreader-geführt“:** App stellt Inhalte bereit, Screenreader spricht.
- **Modus „App-geführt“:** App spricht Navigation selbst, Screenreader-Fokus
  wird bewusst zurückgefahren.
- Modus sichtbar/hörbar umschaltbar; Unterbrechungsregeln definiert.
- Nie gleichzeitig unkoordinierte Sprachausgabe.

### B.4 Haptik

- Unterscheidbare Muster für: Richtung (links/rechts), Warnung, Ankunft,
  Bestätigung, Fehler/Unsicherheit.
- Muster dokumentiert und konsistent; nie einziges Signal, immer redundant.

### B.5 Testanforderungen (Accessibility)

- **Automatisiert:** axe-core, pa11y in CI; Lighthouse-A11y-Score als Gate.
- **Manuell:** vollständige Kernaufgaben mit TalkBack/VoiceOver ohne Sicht.
- **Nutzende:** regelmäßige Tests mit blinden und stark sehbehinderten Personen.
- **Regression:** Accessibility-Fixes erhalten automatisierte Tests.

### B.6 Definition of Done (Accessibility)

Eine Funktion gilt erst als fertig, wenn:
1. sie vollständig per Sprache bedienbar ist,
2. alle Ausgaben eine akustische/haptische Entsprechung haben,
3. axe/pa11y ohne kritische Fehler durchlaufen,
4. ein manueller Screenreader-Durchlauf erfolgreich war,
5. Unsicherheit korrekt kommuniziert wird.
