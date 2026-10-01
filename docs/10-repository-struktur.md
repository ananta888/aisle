# 10 – Vorgeschlagene Repository-Struktur

Monorepo mit klarer Trennung von Client, optionalen Diensten, geteilten
Kern-Interfaces, Daten/Tools und Dokumentation.

```
aisle/
├── README.md
├── LICENSE                      # BSD-3-Clause (Code)
├── LICENSES/                    # Drittanbieter-Lizenzen, Modell-Lizenzen
│   ├── README.md
│   └── ...
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── ACCESSIBILITY.md             # a11y-Ziele, Testverfahren, DoD
├── CHANGELOG.md
├── docs/
│   ├── 00-glossar.md
│   ├── 01-machbarkeit.md
│   ├── 02-architektur.md
│   ├── 03-module.md
│   ├── 04-mvp.md
│   ├── 05-roadmap.md
│   ├── 06-technologien.md
│   ├── 07-vorhandene-projekte.md
│   ├── 08-risiken.md
│   ├── 09-datenschutz-accessibility.md
│   ├── 10-repository-struktur.md
│   ├── 11-api-komponenten.md
│   ├── 12-teststrategie.md
│   ├── 13-hardware-grenzen.md
│   └── 14-lokal-vs-server.md
├── adr/                         # Architecture Decision Records
│   ├── 0001-sprache-und-schreibstil.md
│   ├── 0002-pwa-first.md
│   ├── 0003-lizenz-apache-2.0.md
│   └── ...
├── core/                        # sprachneutrale Interfaces/Spezifikation
│   ├── schema/                  # JSON-Schemata / Protobuf
│   │   ├── observation.schema.json
│   │   ├── intent.schema.json
│   │   ├── store-map.schema.json
│   │   └── instruction.schema.json
│   └── reference/               # Referenzimplementierung der Ports (TS)
│
├── app/                         # PWA (TypeScript)
│   ├── src/
│   │   ├── orchestrator/        # Zustandsautomat, Safety Supervisor
│   │   ├── ports/               # Interface-Definitionen
│   │   ├── adapters/            # konkrete lokale Adapter
│   │   │   ├── speech-in/
│   │   │   ├── speech-out/
│   │   │   ├── intent/
│   │   │   ├── ocr/
│   │   │   ├── barcode/
│   │   │   ├── localizer/
│   │   │   ├── planner/
│   │   │   └── catalog/
│   │   ├── ui/                  # ARIA-/Screenreader-Komponenten
│   │   ├── a11y/                # Fokus, Live-Regionen, Sprachdialog
│   │   └── config/              # Profil-/Adapter-Konfiguration
│   ├── public/
│   │   └── models/              # lokale Modell-Assets (nicht eingecheckt?)
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/                 # Playwright
│   └── package.json
│
├── services/                    # optionale Backend-Dienste (Docker)
│   ├── asr/                     # optional schnellere/lautstärkerobuste STT
│   ├── vlm/                     # optional VLM (Ollama/vLLM)
│   └── docker-compose.yml
│
├── maps/                        # Karten-/Profile
│   ├── profiles/                # supermarkt, bahnhof, museum ...
│   │   └── supermarkt/
│   │       ├── profile.yaml
│   │       └── guidance.yaml    # Sprach-Templates
│   └── stores/                  # konkrete Objekte (Beispieldaten)
│       └── demo-markt/
│           ├── map.json
│           └── catalog.json
│
├── tools/
│   ├── map-editor/              # Kartierungswerkzeug
│   ├── map-import/              # OSM-Indoor-Import
│   └── catalog-import/          # Open-Food-Facts-Import
│
├── eval/                        # Evaluationsdatensätze und -skripte
│   ├── stt/
│   ├── ocr/
│   ├── intent/
│   └── localization/
│
├── .github/
│   ├── workflows/               # CI: lint, test, a11y, license-check
│   └── ISSUE_TEMPLATE/
└── scripts/
```

## Begründung der Struktur

- **`core/` zuerst:** Interfaces und Schemata sind der stabile Vertrag zwischen
  allen Teilen – unabhängig von Sprache und Modell.
- **`app/`** kapselt den ausgelieferten Client; nur permissive Adapter.
- **`services/`** isoliert Copyleft-/schwere Modelle hinter einer Prozessgrenze
  (Netzwerk-/Docker-Grenze), um Lizenz- und Ressourcenkonflikte zu vermeiden.
- **`maps/profiles`** setzt die Ort-Generik um: Supermarkt ist ein Profil,
  weitere Orte kommen als Ordner hinzu.
- **`eval/`** macht Qualität messbar und Regressionen sichtbar.
- **`adr/`** dokumentiert Entscheidungen nachvollziehbar.

## Konventionen

- **Sprache:** Code/Kommentare/Commits auf Englisch; nutzernahe Doku auf Deutsch,
  weitere Sprachen folgen.
- **Branching:** Trunk-based mit kurzen Feature-Branches; PR-Pflicht.
- **Commits:** Conventional Commits.
- **Modelle:** Nicht im Git; über Skripte/Hashes bezogen und in `LICENSES/` erfasst.
- **Daten:** Keine echten personenbezogenen Daten; nur synthetische/öffentliche.
