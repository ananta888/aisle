# ADR 0003: Project license is BSD-3-Clause

- Status: accepted
- Date: 2026-10-01
- Deciders: project owner

## Context

A.I.S.L.E. is published as a public, open-source platform. The code should be
permissively licensed so it can be reused by assistive-tech projects, including
in commercial settings, while retaining attribution and avoiding an endorsement
claim.

Earlier planning proposed Apache-2.0. The project owner chose a BSD license
instead.

## Decision

The project source code is licensed under the **BSD 3-Clause License**.

- Full text: `LICENSE` (Copyright (c) 2026, Peter Stuiber).
- `package.json` declares `"license": "BSD-3-Clause"`.
- Third-party models, libraries and data keep their own licenses and are
  documented in `docs/06-technologien.md`; the license audit stays mandatory
  before any dependency is adopted (AGENTS.md section 26).

## Rationale

- Permissive and widely understood; compatible with our permissive dependency
  choices (MIT/Apache/BSD) and with later distribution.
- Clause 3 prevents using the project name for endorsement without permission.
- Simpler and shorter than Apache-2.0.

## Consequences

- Upstream forks we integrate conceptually (MIT) are not vendored here; only
  separately documented YAML/inline adapters reference them.
- Contributions are accepted under BSD-3-Clause unless stated otherwise.
- No patent grant is included (unlike Apache-2.0); accepted for this project.
