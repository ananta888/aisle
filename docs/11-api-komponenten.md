# 11 – Erste API- und Komponentenstruktur

Die folgenden Interfaces sind ein **Entwurf**, keine finale API. Sie dienen als
gemeinsamer Vertrag zwischen Ports und Adaptern (Client: TypeScript-Protokolle,
Backend: Python-`Protocol`s, serialisiert über JSON).

## 1. Gemeinsamer Datentyp

```ts
export type Confidence = number; // 0.0 .. 1.0

export interface Uncertainty {
  reason: string;
  suggestedAction?: "rescan" | "ask_user" | "continue_cautious" | "stop";
}

export interface Observation<T> {
  value: T;
  confidence: Confidence;
  source: string;
  timestamp: number;
  uncertainty?: Uncertainty;
}
```

Regel: Jeder Port gibt `Observation<T>` zurück, nie `T` direkt.

## 2. Ports (Client)

```ts
export interface SpeechInput {
  start(): Promise<void>;
  stop(): Promise<void>;
  transcribe(audio: ArrayBuffer, opts?: { lang?: string }): Promise<Observation<string>>;
}

export interface SpeechOutput {
  speak(text: string, priority: "info" | "warning" | "critical"): Promise<void>;
  cancel(): Promise<void>;
}

export interface HapticOutput {
  pattern(name: "left" | "right" | "arrive" | "warning" | "error" | "confirm"): void;
}

export interface IntentParser {
  parse(text: string): Promise<Observation<Intent>>;
}

export interface ProductResolver {
  resolve(query: string): Promise<Observation<ProductRef[]>>;
}

export interface ProductCatalog {
  lookup(gtin: string): Promise<Observation<Product>>;
  search(text: string): Promise<Observation<Product[]>>;
  similar(ref: ProductRef): Promise<Observation<Product[]>>;
}

export interface SensorSource {
  frames(): AsyncIterable<CameraFrame>;
  imu(): AsyncIterable<ImuSample>;
}

export interface VisualLocalizer {
  localize(frame: CameraFrame, imu: ImuSample): Promise<Observation<Pose>>;
}

export interface MarkerDetector {
  detect(frame: CameraFrame): Promise<Observation<MarkerObservation[]>>;
}

export interface OCR {
  read(frame: CameraFrame, region?: Region): Promise<Observation<TextBlock[]>>;
}

export interface BarcodeScanner {
  scan(frame: CameraFrame): Promise<Observation<Barcode[]>>;
}

export interface ObjectDetector {
  detect(frame: CameraFrame): Promise<Observation<Detection[]>>;
}

export interface DepthEstimator {
  estimate(frame: CameraFrame): Promise<Observation<DepthMap>>;
}

export interface ShelfRecognizer {
  analyze(frame: CameraFrame): Promise<Observation<ShelfModel>>;
}

export interface MapProvider {
  load(storeId: string): Promise<StoreMap>;
}

export interface PathPlanner {
  plan(map: StoreMap, from: Pose, to: Target): Promise<Path>;
}

export interface GuidanceGenerator {
  step(path: Path, pose: Pose): Promise<Observation<Instruction>>;
}

export interface FinePositioner {
  position(
    ref: ProductRef,
    shelf: ShelfModel,
    frame: CameraFrame
  ): Promise<Observation<RelativePose>>;
}

export interface VLMService {
  describe(frame: CameraFrame, prompt: string): Promise<Observation<string>>;
}
```

## 3. Kern-Datentypen

```ts
export interface Intent {
  name: "find_product" | "cancel" | "stop" | "repeat" | "describe";
  slots: Record<string, string>;
}

export interface ProductRef {
  query: string;
  category?: string;
  gtin?: string;
  productId?: string;
}

export interface Pose {
  x: number; y: number; z?: number;
  heading: number;           // rad
  frame: "store" | "camera";
}

export interface Target {
  kind: "aisle" | "shelf" | "product" | "poi";
  id: string;
}

export interface Instruction {
  text: string;
  direction?: "left" | "right" | "straight" | "back" | "up" | "down" | "stop";
  distanceMeters?: number;
  haptic?: "left" | "right" | "arrive";
}

export interface RelativePose {
  horizontal: "left" | "on" | "right";
  verticalLevel?: number;    // Regal von unten, 1-basiert
  estimatedDistanceMeters?: number;
}
```

## 4. Orchestrator-API

```ts
export interface AssistantOrchestrator {
  handleUtterance(text: string): Promise<void>;
  startGuidance(target: Target): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  getState(): AssistantState;
}

export type AssistantState =
  | { kind: "idle" }
  | { kind: "listening" }
  | { kind: "resolving_product"; query: string }
  | { kind: "localizing" }
  | { kind: "navigating"; path: Path; progress: number }
  | { kind: "arrived_at_shelf"; target: Target }
  | { kind: "fine_positioning"; relative: RelativePose }
  | { kind: "confirming" }
  | { kind: "uncertain"; reason: string }
  | { kind: "paused" }
  | { kind: "lost" }
  | { kind: "done" };
```

## 5. Safety Supervisor

```ts
export interface SafetySupervisor {
  review(
    candidate: { spoken: string; instruction?: Instruction; state: AssistantState }
  ): { spoken: string; downgraded: boolean; reasons: string[] };
}
```

Beispiele für Downgrades:
- „Das Produkt ist vor dir.“ → „Ich bin mir nicht ganz sicher, das Produkt
  könnte direkt vor dir sein.“
- „Du kannst weitergehen.“ (nie ausgeben) → „Vor dir könnte sich ein Hindernis
  befinden, bitte vorsichtig.“

## 6. Event-Bus

Leichtgewichtiges, typisiertes Publish/Subscribe zwischen Modulen:

```ts
export type AssistantEvent =
  | { type: "speech.final"; text: string }
  | { type: "intent"; intent: Intent; confidence: number }
  | { type: "localization.updated"; pose: Pose; confidence: number }
  | { type: "route.updated"; path: Path }
  | { type: "shelf.observed"; shelf: ShelfModel; confidence: number }
  | { type: "safety.warning"; message: string };
```

Kein Modul ruft ein anderes direkt auf; der Orchestrator konsumiert Events.

## 7. Optionale Server-API (REST/WebSocket)

Nur für schwere Adapter, immer optional. Der Client spricht **denselben Port**,
nur mit anderem Adapter.

```
POST /v1/asr          multipart audio  -> Observation<string>
POST /v1/ocr          multipart image  -> Observation<TextBlock[]>
POST /v1/vlm/describe multipart image + prompt -> Observation<string>
WS   /v1/stream       bidirektionaler Status-/Navigationsstrom
```

Prinzipien:
- Kein Serverzustand über die Anfrage hinaus (keine Speicherung).
- Keine Authentifizierung für lokale Nutzung nötig.
- Jeder Endpunkt hat einen dokumentierten lokalen Fallback.

## 8. Konfigurationsschema (Auszug)

```yaml
activeProfile: supermarkt
capabilities:
  speech_in:  { adapter: vosk, mode: local }
  speech_out: { adapter: piper, mode: local }
  intent:     { adapter: rules }
  ocr:        { adapter: tesseract_js, mode: local }
  barcode:    { adapter: zxing_js, mode: local }
  localizer:  { adapter: marker_vio, mode: local }
  planner:    { adapter: astar, mode: local }
  vlm:        { adapter: none, mode: local }
thresholds:
  confidence: { low: 0.4, high: 0.75 }
```

## 9. Nächste Schritte (nach Freigabe)

1. Diese Interfaces als `core/`-Schemata versionieren.
2. Walking Skeleton mit Dummy-Adaptern (Echo-Liste).
3. Ersten echten Adapter pro Port implementieren (Priorität: STT, Intent, Planner).
