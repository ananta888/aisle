# AGENTS.md

## Purpose

This repository develops an open-source, mobile-first assistive navigation system for blind and visually impaired people.

The initial reference scenario is navigation inside supermarkets:

spoken product request  
→ perception  
→ localization  
→ route guidance  
→ shelf localization  
→ product identification  
→ accessible audio/haptic guidance.

All agents working in this repository must follow:

- SOLID
- Domain-Driven Design (DDD)
- Test-Driven Development (TDD)
- Accessibility First
- Safety First
- Privacy by Design
- deterministic behaviour where possible
- modular provider-independent architecture

The agent is responsible not only for implementation but also for maintaining the repository planning structure.

---

# 1. Mandatory Todo Management

Todo management is part of the agent's normal work.

The agent MUST automatically create, maintain, validate and organize the Todo structure.

If the following structure does not exist, create it:

```text
todos/
├── schemas/
│   └── todo.schema.json
├── templates/
│   └── todo.template.json
├── active/
├── backlog/
├── research/
├── blocked/
└── archive/
```

Do not wait for the user to manually create these directories.

---

# 2. Todo Schema

The canonical schema is:

```text
todos/schemas/todo.schema.json
```

Every Todo JSON must validate against this schema.

The agent must never silently create arbitrary Todo formats.

Before creating or modifying a Todo:

1. load the canonical schema
2. validate the existing file if present
3. preserve compatible existing data
4. update the Todo
5. validate again

If validation fails:

- fix the Todo where safe
- otherwise mark the problem explicitly
- never silently ignore schema violations

---

# 3. Todo Lifecycle

Todo location represents its current lifecycle state.

## Research

```text
todos/research/
```

Use for unresolved technical investigation.

Examples:

- SLAM evaluation
- OCR benchmark
- VLM comparison
- smartphone sensor feasibility

---

## Backlog

```text
todos/backlog/
```

Use for accepted future work that is not currently being implemented.

---

## Active

```text
todos/active/
```

Use when implementation has started or is immediately actionable.

---

## Blocked

```text
todos/blocked/
```

Use when meaningful progress is impossible because of an unresolved dependency.

Every blocked Todo must describe:

- blocking reason
- blocking dependency
- possible resolution

---

## Archive

```text
todos/archive/
```

Use when the entire Todo track is completed or superseded.

Do not delete completed planning history.

---

# 4. Automatic Todo Movement

The agent must move Todo files automatically when their lifecycle changes.

Examples:

```text
research → backlog
backlog → active
active → blocked
blocked → active
active → archive
```

File movement must preserve Git history where possible.

The Todo's internal `status` must match its directory.

A file must not remain under `active/` while declaring:

```json
"status": "done"
```

Completed Todo tracks belong in:

```text
todos/archive/
```

---

# 5. Todo Naming

Use:

```text
todo.<bounded-context-or-capability>.json
```

Examples:

```text
todo.indoor-localization.json
todo.product-recognition.json
todo.accessible-guidance.json
todo.safety-confidence-engine.json
```

Avoid generic files such as:

```text
todo.misc.json
todo.features.json
todo.stuff.json
```

Prefer bounded domain concepts.

---

# 6. Todo Creation

When work introduces a substantial new capability and no suitable Todo exists, the agent must create one automatically.

Do not overload unrelated Todo tracks.

A Todo track should contain:

- purpose
- architectural scope
- domain context
- dependencies
- milestones
- tasks
- acceptance criteria
- risks
- safety implications
- accessibility implications
- privacy implications
- verification requirements

---

# 7. Todo Maintenance During Work

Before implementation:

1. find the relevant Todo
2. create one if none exists
3. set affected tasks to `in_progress`

During implementation:

- add discovered tasks
- record blockers
- maintain dependencies
- split tasks that became too broad
- update technical assumptions
- record important decisions

After implementation:

- update task status
- add verification evidence
- update remaining work
- archive the Todo if fully complete

Todo maintenance is not optional documentation work.

It is part of implementation.

---

# 8. No False Completion

A task must never be marked `done` only because code exists.

`done` requires applicable acceptance criteria to be fulfilled.

Examples:

- implementation exists
- tests pass
- architecture boundaries are respected
- accessibility is verified
- safety behaviour is defined
- failure cases are tested
- documentation is updated

If repository implementation is complete but real-world validation is missing, use:

```text
validation
```

or:

```text
partial
```

Do not claim real-world readiness without evidence.

---

# 9. SOLID Is Mandatory

All implementation must follow SOLID.

## SRP

A class/module/function should have one clear responsibility.

Avoid:

- god services
- giant managers
- mixed UI/domain/infrastructure code

## OCP

Prefer extension through:

- strategies
- ports
- adapters
- policies
- interfaces

Avoid repeatedly modifying central core logic.

## LSP

Alternative implementations must remain substitutable.

Example:

```text
SpeechRecognizer
├── LocalWhisperRecognizer
├── BrowserSpeechRecognizer
└── CloudSpeechRecognizer
```

Core code must work against the abstraction.

## ISP

Prefer narrow interfaces.

Do not expose large provider interfaces where consumers need only one capability.

## DIP

Domain code depends on abstractions.

Infrastructure depends on domain ports.

Never make domain logic directly depend on:

- OpenAI
- Google
- Android APIs
- specific OCR engines
- specific VLM providers
- retailer APIs

---

# 10. Domain-Driven Design

Architecture must use explicit bounded contexts.

Initial bounded contexts should include:

```text
Accessibility
Perception
Localization
Navigation
Guidance
ProductDiscovery
StoreMapping
Safety
```

Do not collapse these into one application service.

---

# 11. Domain Model

Business concepts should be explicit types.

Prefer concepts such as:

```text
Position
Pose
Destination
NavigationInstruction
Observation
Obstacle
Product
ProductCandidate
Shelf
Aisle
Route
Confidence
LocalizationState
GuidanceSession
```

Avoid passing loosely structured dictionaries through core domain logic.

Use value objects where appropriate.

Examples:

```text
Distance
ConfidenceScore
Heading
BoundingBox
ProductIdentifier
Timestamp
```

---

# 12. Ubiquitous Language

Use consistent terminology throughout:

- source code
- Todo files
- tests
- APIs
- documentation

Do not call the same concept:

```text
target
destination
goal
endpoint
```

in different parts of the same bounded context unless they represent different domain concepts.

---

# 13. Aggregate Boundaries

State-changing behaviour should live behind clear domain boundaries.

Examples:

```text
NavigationSession
LocalizationSession
GuidanceSession
```

Do not allow arbitrary components to mutate navigation state directly.

---

# 14. Domain Events

Use domain events where meaningful.

Examples:

```text
LocalizationLost
LocalizationRecovered
DestinationResolved
ProductCandidateDetected
TargetProductConfirmed
ObstacleDetected
NavigationPaused
NavigationResumed
```

Events must represent domain facts, not infrastructure implementation details.

---

# 15. Ports and Adapters

Use hexagonal architecture where practical.

Example:

```text
Domain
    |
    +-- SpeechInputPort
    +-- SpeechOutputPort
    +-- VisionPort
    +-- LocalizationPort
    +-- ProductCatalogPort
    +-- MapRepositoryPort

Infrastructure
    |
    +-- WhisperAdapter
    +-- AndroidCameraAdapter
    +-- ORB-SLAMAdapter
    +-- RetailerApiAdapter
```

Domain code must not know which concrete provider is active.

---

# 16. Test-Driven Development

TDD is the default implementation workflow.

Use:

```text
RED
→ GREEN
→ REFACTOR
```

For new behaviour:

1. write a failing test
2. implement the smallest correct solution
3. make the test pass
4. refactor
5. run the relevant test suite
6. update the Todo

Do not write large feature implementations first and tests afterwards unless technically unavoidable.

---

# 17. Test Pyramid

Prefer:

```text
many unit tests
↓
fewer integration tests
↓
few end-to-end tests
↓
controlled real-world validation
```

Core domain logic should be testable without:

- camera
- network
- cloud provider
- physical supermarket
- real speech hardware

---

# 18. Required Tests

Where applicable, test:

## Domain

- route decisions
- confidence thresholds
- stale observations
- localization loss
- state transitions
- fallback behaviour

## Accessibility

- screen-reader semantics
- speech-only interaction
- focus handling
- ARIA live regions
- large touch targets

## Safety

- unknown obstacle
- low confidence
- contradictory observations
- stale sensor data
- localization loss
- incorrect OCR
- product not found
- unavailable model

## Infrastructure

- adapter contracts
- provider failures
- timeout behaviour
- offline operation
- invalid responses

---

# 19. Safety First

The system must never invent physical facts.

Never hallucinate:

- distances
- obstacles
- aisle numbers
- shelf positions
- coordinates
- routes

Spatial claims require evidence from:

- sensors
- maps
- deterministic geometry
- validated perception

LLM/VLM output alone is insufficient for safety-critical spatial instructions.

---

# 20. Confidence Is Domain Data

Confidence must remain available throughout the system.

Do not reduce:

```text
product = oat_milk
confidence = 0.51
```

to:

```text
product = oat_milk
```

Navigation decisions must consider confidence.

Low confidence should result in:

```text
STOP
→ reacquire
→ reassess
```

rather than guessing.

---

# 21. Accessibility First

Every user-facing feature must work without visual dependency.

Prefer:

- speech
- screen reader
- semantic UI
- ARIA
- haptics
- minimal interaction

No important information may exist only visually.

---

# 22. Privacy by Design

Camera and microphone data are sensitive.

Default:

- local processing where possible
- ephemeral processing
- no unnecessary recording
- no hidden telemetry
- minimal persistence
- no facial recognition requirement

Never commit:

- user audio
- camera recordings
- personal data
- credentials
- API keys

---

# 23. Agent Workflow

For every substantial task:

```text
1. inspect repository
2. inspect AGENTS.md
3. inspect Todo schema
4. inspect relevant Todos
5. create/reorganize Todo structure if necessary
6. identify bounded context
7. define or refine domain model
8. write failing tests
9. implement smallest viable slice
10. refactor toward SOLID/DDD
11. run tests
12. update Todo
13. move Todo if lifecycle changed
14. validate all modified Todo JSON files
15. review git diff
```

---

# 24. Repository Hygiene

Never use:

```text
git add .
git add -A
```

without reviewing changes first.

Do not commit:

- generated runtime files
- local environments
- secrets
- model caches
- raw recordings
- temporary datasets

---

# 25. Automatic Planning Cleanup

Whenever working in the repository, inspect the Todo structure for obvious inconsistencies.

Fix automatically where safe:

- wrong lifecycle folder
- invalid schema
- stale completed tasks
- missing dependency references
- duplicate tracks
- orphaned Todo files
- inconsistent statuses

Do not perform broad destructive rewrites solely for cosmetic consistency.

---

# 26. Todo Validation Must Be Automatable

Provide or maintain a validator such as:

```text
tools/validate_todos.py
```

It should verify:

- JSON validity
- schema validity
- valid directory/status relationship
- unique task IDs
- valid dependency references
- milestone/task references
- duplicate track names

CI should run this validation automatically.

---

# 27. Definition of Done

A feature is done only when:

```text
domain model exists
+ implementation exists
+ tests pass
+ Todo is updated
+ Todo validates
+ documentation is current
+ accessibility reviewed
+ safety reviewed
+ privacy reviewed
```

For safety-relevant functionality:

```text
code complete != real-world validated
```

These states must remain distinct.

---

# 28. Priority Order

If requirements conflict:

1. physical safety
2. accessibility
3. privacy
4. domain correctness
5. reliability
6. maintainability
7. performance
8. convenience

Never trade safety or accessibility for a visually impressive demo.
