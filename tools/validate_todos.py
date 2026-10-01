#!/usr/bin/env python3
"""Validate A.I.S.L.E. Todo tracks against the canonical schema and lifecycle rules.

Checks performed (AGENTS.md section 26):
  - JSON validity
  - schema validity (todos/schemas/todo.schema.json)
  - valid directory/status relationship
  - unique task IDs (and unique milestone/risk IDs, per track)
  - valid dependency references
  - milestone/task references
  - duplicate track names (todo ids are globally unique and match the filename)

Usage:
    python3 tools/validate_todos.py [--todos-dir PATH] [--schema PATH]

Exit code 0 = valid, 1 = validation errors.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

try:
    import jsonschema
except ImportError:  # pragma: no cover - dependency guard
    print(
        "error: the 'jsonschema' package is required "
        "(pip install jsonschema)",
        file=sys.stderr,
    )
    sys.exit(2)

ID_RE = re.compile(r"^todo\.[a-z0-9]+(-[a-z0-9]+)*$")

# Which statuses are legal inside which lifecycle directory.
LIFECYCLE_DIRS: dict[str, set[str]] = {
    "research": {"research"},
    "backlog": {"backlog"},
    "active": {"active", "validation", "partial"},
    "blocked": {"blocked"},
    "archive": {"done", "superseded"},
}


def load_json_file(path: Path) -> tuple[object | None, str | None]:
    try:
        return json.loads(path.read_text(encoding="utf-8")), None
    except (OSError, json.JSONDecodeError) as exc:
        return None, str(exc)


def rel(path: Path, root: Path) -> str:
    try:
        return str(path.relative_to(root))
    except ValueError:
        return str(path)


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--todos-dir",
        default=str(repo_root / "todos"),
        help="Path to the todos directory (default: <repo>/todos).",
    )
    parser.add_argument(
        "--schema",
        default=None,
        help="Path to todo.schema.json (default: <todos-dir>/schemas/todo.schema.json).",
    )
    args = parser.parse_args()

    todos_dir = Path(args.todos_dir)
    schema_path = (
        Path(args.schema)
        if args.schema
        else todos_dir / "schemas" / "todo.schema.json"
    )

    errors: list[str] = []
    warnings: list[str] = []

    if not todos_dir.is_dir():
        print(f"error: todos directory not found: {todos_dir}", file=sys.stderr)
        return 1

    schema, schema_err = load_json_file(schema_path)
    if schema_err is not None or schema is None:
        print(f"error: cannot load schema {schema_path}: {schema_err}", file=sys.stderr)
        return 1

    validator = jsonschema.Draft202012Validator(
        schema, format_checker=jsonschema.FormatChecker()
    )

    tracks: dict[str, tuple[Path, dict]] = {}
    counts: dict[str, int] = {}

    # Pass 1: load, schema-validate, structural checks.
    for dir_name, allowed_status in LIFECYCLE_DIRS.items():
        directory = todos_dir / dir_name
        if not directory.is_dir():
            errors.append(f"missing lifecycle directory: {rel(directory, repo_root)}")
            continue

        files = sorted(directory.glob("*.json"))
        counts[dir_name] = len(files)

        for path in files:
            location = rel(path, repo_root)
            doc, err = load_json_file(path)
            if err is not None:
                errors.append(f"{location}: invalid JSON: {err}")
                continue
            if not isinstance(doc, dict):
                errors.append(f"{location}: top-level JSON value must be an object")
                continue

            for error in sorted(
                validator.iter_errors(doc), key=lambda e: list(e.absolute_path)
            ):
                where = "/".join(str(p) for p in error.absolute_path) or "<root>"
                errors.append(f"{location}: schema: {where}: {error.message}")

            todo_id = doc.get("id")
            if isinstance(todo_id, str):
                if not ID_RE.match(todo_id):
                    errors.append(
                        f"{location}: id '{todo_id}' does not match todo.<name>"
                    )
                if path.stem != todo_id:
                    errors.append(
                        f"{location}: filename must equal id '{todo_id}.json'"
                    )
                if todo_id in tracks:
                    other = rel(tracks[todo_id][0], repo_root)
                    errors.append(
                        f"{location}: duplicate track id '{todo_id}' "
                        f"(also in {other})"
                    )
                else:
                    tracks[todo_id] = (path, doc)

            status = doc.get("status")
            if isinstance(status, str) and status not in allowed_status:
                errors.append(
                    f"{location}: status '{status}' is not allowed in "
                    f"'{dir_name}/' (allowed: {sorted(allowed_status)})"
                )

            # Per-track uniqueness of task / milestone / risk ids.
            for collection, prefix in (
                ("milestones", "milestone"),
                ("tasks", "task"),
                ("risks", "risk"),
            ):
                items = doc.get(collection, [])
                if not isinstance(items, list):
                    continue
                seen: set[str] = set()
                for item in items:
                    if not isinstance(item, dict):
                        continue
                    item_id = item.get("id")
                    if not isinstance(item_id, str):
                        continue
                    if item_id in seen:
                        errors.append(
                            f"{location}: duplicate {prefix} id '{item_id}'"
                        )
                    seen.add(item_id)
                if collection == "tasks":
                    milestone_ids = {
                        m.get("id")
                        for m in doc.get("milestones", [])
                        if isinstance(m, dict)
                    }
                    for item in items:
                        if not isinstance(item, dict):
                            continue
                        ref = item.get("milestoneId")
                        if ref is not None and ref not in milestone_ids:
                            errors.append(
                                f"{location}: task '{item.get('id')}' references "
                                f"unknown milestone '{ref}'"
                            )
                        if item.get("status") == "done" and not item.get("evidence"):
                            warnings.append(
                                f"{location}: task '{item.get('id')}' is done but "
                                f"has no evidence"
                            )

    # Pass 2: dependency references.
    for todo_id, (path, doc) in tracks.items():
        location = rel(path, repo_root)
        for dep in doc.get("dependencies", []):
            if dep not in tracks:
                errors.append(
                    f"{location}: dependency '{dep}' does not resolve to a known track"
                )
            elif dep == todo_id:
                errors.append(f"{location}: track depends on itself")

    # Report.
    for name in LIFECYCLE_DIRS:
        print(f"  {name + '/':<12} {counts.get(name, 0)} track(s)")

    if warnings:
        print("\nWarnings:")
        for warning in warnings:
            print(f"  ! {warning}")

    if errors:
        print("\nErrors:")
        for error in errors:
            print(f"  x {error}")
        print(f"\nFAILED: {len(errors)} error(s), {len(warnings)} warning(s)")
        return 1

    print(f"\nOK: {len(tracks)} track(s) valid, {len(warnings)} warning(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
