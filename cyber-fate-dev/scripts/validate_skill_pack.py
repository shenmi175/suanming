#!/usr/bin/env python3
"""Validate the local Cyber Fate Codex skill pack and runtime policy."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

RUNTIME_SCAN_ROOTS = [
    ROOT / "src",
    ROOT / "tests",
    ROOT / "prompts",
    ROOT / "docs",
    ROOT / "README.md",
    ROOT / ".env.example",
]

FORBIDDEN_RUNTIME_PATTERNS = [
    r"runMockPipeline",
    r"mockPipeline",
    r"buildCyberFateReport",
    r"sampleReport",
    r"/report/sample",
    r"CYBER_FATE_LLM_MODE\s*[:=].*mock",
]


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


def iter_scan_files(root: Path):
    if not root.exists():
        return
    if root.is_file():
        yield root
        return
    for path in root.rglob("*"):
        if path.is_file() and path.suffix in {".md", ".json", ".ts", ".tsx", ".js", ".mjs", ".env"}:
            yield path


def validate_no_local_generation() -> list[str]:
    errors: list[str] = []
    compiled = [re.compile(pattern, re.I) for pattern in FORBIDDEN_RUNTIME_PATTERNS]
    for root in RUNTIME_SCAN_ROOTS:
        for path in iter_scan_files(root):
            text = read(path)
            for line_no, line in enumerate(text.splitlines(), start=1):
                if any(pattern.search(line) for pattern in compiled):
                    rel = path.relative_to(ROOT)
                    errors.append(f"{rel}:{line_no}: forbidden local-generation marker: {line.strip()}")
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

    errors.extend(validate_no_local_generation())

    if errors:
        print("Cyber Fate validation failed:")
        for err in errors:
            print(f"- {err}")
        return 1

    print(f"Cyber Fate validation passed. Found {len(skill_files)} skills and no local-generation markers.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
