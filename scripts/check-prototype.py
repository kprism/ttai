#!/usr/bin/env python3
"""Validate TT AI prototype JavaScript and local asset references."""

from __future__ import annotations

import re
import subprocess
import sys
import tempfile
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED_PARTS = {".git", "node_modules", "dist", "build", "_handoff"}
INLINE_SCRIPT_RE = re.compile(
    r"<script(?![^>]*\bsrc\s*=)[^>]*>(.*?)</script>",
    re.IGNORECASE | re.DOTALL,
)
REFERENCE_RE = re.compile(
    r"\b(?:src|href)\s*=\s*(['\"])(.*?)\1",
    re.IGNORECASE,
)


def included(path: Path) -> bool:
    return not any(part in EXCLUDED_PARTS for part in path.parts)


def run_node_check(path: Path, label: str, errors: list[str]) -> None:
    result = subprocess.run(
        ["node", "--check", str(path)],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        details = (result.stderr or result.stdout).strip()
        errors.append(f"{label}\n{details}")


def check_javascript(errors: list[str]) -> int:
    count = 0
    for path in sorted(ROOT.rglob("*.js")):
        if not included(path.relative_to(ROOT)):
            continue
        count += 1
        run_node_check(path, f"JavaScript 문법 오류: {path.relative_to(ROOT)}", errors)
    return count


def check_inline_scripts(errors: list[str]) -> int:
    count = 0
    for html_path in sorted(ROOT.rglob("*.html")):
        relative = html_path.relative_to(ROOT)
        if not included(relative):
            continue
        text = html_path.read_text(encoding="utf-8")
        for index, script in enumerate(INLINE_SCRIPT_RE.findall(text), start=1):
            if not script.strip():
                continue
            count += 1
            with tempfile.NamedTemporaryFile(
                mode="w",
                suffix=".js",
                encoding="utf-8",
                delete=False,
            ) as temporary:
                temporary.write(script)
                temporary_path = Path(temporary.name)
            try:
                run_node_check(
                    temporary_path,
                    f"HTML 내부 스크립트 문법 오류: {relative} (script #{index})",
                    errors,
                )
            finally:
                temporary_path.unlink(missing_ok=True)
    return count


def resolve_reference(html_path: Path, reference: str) -> Path | None:
    clean = unquote(reference.split("?", 1)[0].split("#", 1)[0].strip())
    if not clean:
        return None
    lowered = clean.lower()
    if lowered.startswith(("http://", "https://", "mailto:", "tel:", "data:", "javascript:")):
        return None
    if "{{" in clean or "${" in clean:
        return None
    if clean.startswith("/"):
        return ROOT / clean.lstrip("/")
    return (html_path.parent / clean).resolve()


def check_local_references(errors: list[str]) -> int:
    count = 0
    for html_path in sorted(ROOT.rglob("*.html")):
        relative = html_path.relative_to(ROOT)
        if not included(relative):
            continue
        text = html_path.read_text(encoding="utf-8")
        for _, reference in REFERENCE_RE.findall(text):
            target = resolve_reference(html_path, reference)
            if target is None:
                continue
            count += 1
            try:
                target.relative_to(ROOT)
            except ValueError:
                errors.append(f"저장소 밖을 가리키는 경로: {relative} -> {reference}")
                continue
            if not target.exists():
                errors.append(f"존재하지 않는 로컬 경로: {relative} -> {reference}")
    return count


def main() -> int:
    errors: list[str] = []
    js_count = check_javascript(errors)
    inline_count = check_inline_scripts(errors)
    reference_count = check_local_references(errors)

    print(f"검사한 JavaScript 파일: {js_count}개")
    print(f"검사한 HTML 내부 스크립트: {inline_count}개")
    print(f"검사한 로컬 파일 연결: {reference_count}개")

    if errors:
        print("\n검사 실패", file=sys.stderr)
        for number, error in enumerate(errors, start=1):
            print(f"\n[{number}] {error}", file=sys.stderr)
        return 1

    print("\n모든 프로토타입 검사를 통과했습니다.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
