# 15 – MVP Priority

> **Autoritativ.** Dieses Dokument hat bei Konflikten Vorrang vor
> [04-mvp.md](04-mvp.md). Es beschreibt die geschlossene
> Wahrnehmungs-Führungs-Schleife als höchste Priorität.

The first MVP has one primary end-to-end goal:

```text
spoken product request
→ live smartphone camera
→ vision model detects/searches for the requested product
→ system continuously estimates where the product is relative to the camera
→ spoken guidance leads the user toward the product
```

Example:

```text
User:
"Ich suche Hafermilch."

System:
"Ich suche nach Hafermilch."

Camera/Vision:
product candidate detected on the right side

System:
"Etwas nach rechts."

Camera/Vision:
target becomes larger and more central

System:
"Geradeaus."

Camera/Vision:
target close to centre

System:
"Das Produkt ist direkt vor dir, ungefähr auf Brusthöhe."
```

## Explicit MVP Scope

The first MVP should **NOT** require:

- full supermarket maps
- SLAM
- complete indoor routing
- retailer APIs
- product inventory integrations
- crowdsourced maps
- multi-floor navigation
- complex route planning

These are later extensions.

The MVP assumes that the user is already in an approximate area where the
product can eventually become visible through the smartphone camera.

---

# MVP Core Pipeline

```text
Microphone
↓
Speech-to-Text
↓
Product Intent
↓
Target Product
↓
Live Camera Stream
↓
Vision / VLM
↓
Target Candidate Detection
↓
Relative Position
↓
Guidance Decision
↓
Text-to-Speech
↓
User movement
↓
new camera frame
↓
repeat
```

This closed perception-guidance loop is the highest-priority architecture.

---

# MVP Bounded Contexts

Only the following bounded contexts are required for the initial MVP:

## ProductRequest

Responsibilities:

- receive spoken request
- convert speech to text
- normalize requested product
- maintain current target product

Example:

```text
"Ich suche die Oatly Barista."
→ TargetProduct("Oatly Barista")
```

---

## VisualSearch

Responsibilities:

- consume live camera frames
- identify target-product candidates
- produce structured observations
- expose confidence
- expose bounding box / relative position

Example domain result:

```json
{
  "target": "Oatly Barista",
  "detected": true,
  "confidence": 0.88,
  "position": {
    "horizontal": "right",
    "vertical": "center"
  },
  "bounding_box": {
    "x": 0.71,
    "y": 0.43,
    "width": 0.12,
    "height": 0.27
  }
}
```

Vision/VLM responses must be converted into structured domain objects.

---

## Guidance

Responsibilities:

Convert observations into simple movement instructions.

Examples:

```text
target not detected
→ "Bewege die Kamera langsam nach rechts."

target far right
→ "Weiter nach rechts."

target centered but small
→ "Geradeaus."

target centered and sufficiently large
→ "Das Produkt befindet sich direkt vor dir."
```

Guidance must be deterministic where possible.

The VLM should identify and localize the target.

The VLM should **NOT** freely invent navigation instructions.

---

## SpeechOutput

Responsibilities:

- convert guidance instructions to speech
- avoid repeating identical instructions unnecessarily
- prioritize important state changes
- interrupt obsolete instructions

---

# MVP Vision Strategy

The first implementation should support replaceable vision providers.

Interface example:

```text
TargetProductDetector
```

Possible adapters:

```text
LocalVLMAdapter
CloudVLMAdapter
ObjectDetectorAdapter
HybridVisionAdapter
```

The MVP may initially use a strong general-purpose Vision Language Model because
this allows product search without training a dedicated detector for every
supermarket product.

Architecture must nevertheless allow later replacement with:

- YOLO-style detection
- embeddings
- OCR
- barcode recognition
- retailer-specific models
- hybrid pipelines

---

# Live Vision Loop

Do not send every camera frame blindly to a large VLM.

Design the system around configurable sampling.

Example:

```text
camera: 30 FPS

cheap preprocessing:
30 FPS

VLM analysis:
1–3 FPS

guidance:
only when state meaningfully changes
```

The exact frequency must remain configurable.

Avoid unnecessary cost, latency and battery usage.

---

# Temporal Tracking

Do not treat every frame independently.

The MVP should maintain a short-lived target track.

Example:

```text
frame 1 → target right, confidence .82
frame 2 → target right, confidence .88
frame 3 → temporary miss
frame 4 → target center-right, confidence .91
```

A single failed frame should not immediately mean:

```text
TARGET LOST
```

Use bounded temporal smoothing.

---

# Guidance State Machine

Guidance should use an explicit state machine.

Suggested states:

```text
IDLE
LISTENING
SEARCHING
TARGET_CANDIDATE
TARGET_TRACKED
GUIDING
TARGET_LOST
TARGET_REACHED
ERROR
```

Examples:

```text
SEARCHING
→ TARGET_CANDIDATE
→ TARGET_TRACKED
→ GUIDING
→ TARGET_REACHED
```

or:

```text
GUIDING
→ TARGET_LOST
→ SEARCHING
```

Avoid implicit LLM-controlled state transitions.

---

# Search Behaviour

If the target is not visible:

The system should guide camera search rather than pretend to know where the
product is.

Examples:

```text
"Bewege das Handy langsam nach links."

"Schwenke etwas nach oben."

"Ich kann das Produkt noch nicht erkennen."
```

This MVP performs visual search, not full-store route planning.

---

# Distance

Do not claim exact distances unless supported by reliable depth information.

Prefer:

```text
"nah"
"weiter entfernt"
"direkt vor dir"
```

instead of:

```text
"37 Zentimeter entfernt"
```

unless depth or geometry supports that measurement.

---

# Required MVP Todo Tracks

The agent should automatically create at least:

```text
todos/active/todo.mvp-end-to-end-loop.json
todos/active/todo.speech-product-request.json
todos/active/todo.live-camera-pipeline.json
todos/active/todo.vision-product-search.json
todos/active/todo.target-tracking.json
todos/active/todo.spoken-guidance.json
todos/active/todo.guidance-state-machine.json
todos/active/todo.mvp-safety-confidence.json
```

Everything not required for this loop should normally enter:

```text
todos/backlog/
```

instead of expanding MVP scope.

---

# MVP Acceptance Goal

The MVP is successful when a test user can:

1. open the application
2. say a product name
3. point the smartphone camera toward supermarket shelves
4. receive live spoken search instructions
5. have the requested product detected
6. receive left/right/up/down/forward guidance
7. approach the detected product
8. receive a clear target-reached message

without needing to interact visually with the UI.

---

# MVP Development Rule

When choosing between:

```text
complete supermarket navigation
```

and:

```text
a reliable live camera → product → spoken guidance loop
```

always prioritize the second until the MVP acceptance goal is satisfied.
