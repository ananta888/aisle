# todos/

Planning structure for A.I.S.L.E. See `AGENTS.md` sections 1–8 for the rules.

```
todos/
├── schemas/todo.schema.json     # canonical schema (do not fork)
├── templates/todo.template.json # starting point for a new track
├── research/                    # unresolved technical investigation
├── backlog/                     # accepted future work, not yet started
├── active/                      # implementation started / immediately actionable
├── blocked/                     # no meaningful progress possible (needs `blocking`)
└── archive/                     # completed or superseded tracks
```

## Rules

- One file = one track. Name: `todo.<bounded-context-or-capability>.json`.
- The filename must equal the `id`, and the `status` must match the directory.
- A track with `status: "done"` never lives in `active/`; it belongs in `archive/`.
- Tasks are only `done` when their acceptance criteria are fulfilled and evidence
  is recorded. Use `validation` or `partial` when real-world validation is missing.

## Directory → status

| Directory   | Allowed `status`                     |
|-------------|--------------------------------------|
| `research/` | `research`                           |
| `backlog/`  | `backlog`                            |
| `active/`   | `active`, `validation`, `partial`    |
| `blocked/`  | `blocked` (requires `blocking`)      |
| `archive/`  | `done`, `superseded`                 |

## Validate

```sh
python3 tools/validate_todos.py
```

CI runs the same command on every change under `todos/`.
