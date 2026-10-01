# Contributing to A.I.S.L.E.

Thanks for your interest. A.I.S.L.E. is an open-source, mobile-first assistive
navigation and product search system for blind and visually impaired people.

## Ground rules

- Read `AGENTS.md`: SOLID, DDD, TDD, Accessibility First, Safety First,
  Privacy by Design.
- Accessible and safe behaviour is not negotiable. Never trade safety or
  accessibility for a nicer demo.
- Never commit secrets, API keys, tokens, user audio, camera recordings or
  personal data.
- Keep the planning structure current: `todos/` and `tools/validate_todos.py`.

## Workflow

1. Find or create the relevant track under `todos/` (see `todos/README.md`).
2. Write a failing test first, then the smallest correct implementation.
3. Run the checks:
   ```sh
   python3 tools/validate_todos.py
   cd app && npm test && npm run typecheck
   ```
4. Update the Todo (task status, evidence) and validate again.
5. Open a pull request with a short description and the verification you ran.

## Code style

- Code, comments and commits in English; user-facing documentation may be German.
- No comments unless they add real value.
- Conventional Commit subjects; small, focused commits.

## License

By contributing you agree that your contributions are licensed under the
project's BSD 3-Clause License (`LICENSE`). Third-party dependencies keep their
own licenses; document them in `docs/06-technologien.md`.
