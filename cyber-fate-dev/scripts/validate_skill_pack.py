#!/usr/bin/env python3
"""Minimal validator for this Codex skill pack.

Checks:
- every .agents/skills/*/SKILL.md has YAML-ish front matter with name and description
- referenced dev skill reference files exist
- root AGENTS.md exists
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def validate_skill(path: Path) -> list[str]:
    errors: list[str] = []
    text = read(path)
    match = re.match(r"^---\n(.*?)\n---\n", text, flags=re.S)
    if not match:
        return [f"{path}: missing front matter"]
    front = match.group(1)
    if not re.search(r"^name:\s*\S+", front, flags=re.M):
        errors.append(f"{path}: missing name")
    if not re.search(r"^description:\s*.+", front, flags=re.M):
        errors.append(f"{path}: missing description")
    return errors


def main() -> int:
    errors: list[str] = []
    if not (ROOT / "AGENTS.md").exists():
        errors.append("missing root AGENTS.md")

    skill_files = sorted((ROOT / ".agents" / "skills").glob("*/SKILL.md"))
    if not skill_files:
        errors.append("no skill files found under .agents/skills")
    for skill_file in skill_files:
        errors.extend(validate_skill(skill_file))

    required_refs = [
        ROOT / ".agents/skills/cyber-fate-dev/references/openai-agents-sdk.md",
        ROOT / ".agents/skills/cyber-fate-dev/references/mature-stack.md",
        ROOT / ".agents/skills/cyber-fate-dev/references/skill-design-references.md",
        ROOT / ".agents/skills/cyber-fate-reading/references/report-json-contract.md",
    ]
    for ref in required_refs:
        if not ref.exists():
            errors.append(f"missing reference: {ref.relative_to(ROOT)}")

    if errors:
        print("Skill pack validation failed:")
        for err in errors:
            print(f"- {err}")
        return 1

    print(f"Skill pack validation passed. Found {len(skill_files)} skills.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
