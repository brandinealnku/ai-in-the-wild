#!/usr/bin/env python3
"""Validate untrusted candidate queue and public source-health summary."""
import json
from pathlib import Path
from urllib.parse import urlparse
root = Path(__file__).resolve().parents[1]
c = json.loads((root / "data/candidates.json").read_text(encoding="utf-8"))
h = json.loads((root / "data/discovery-health.json").read_text(encoding="utf-8"))
assert c.get("schemaVersion") == h.get("schemaVersion") == 1
assert isinstance(c.get("candidates"), list) and len(c["candidates"]) <= 300
seen = set()
for item in c["candidates"]:
    assert item["id"] not in seen
    seen.add(item["id"])
    assert item["status"] in {"needs_review", "reviewed", "dismissed"}
    assert item["evidenceStatus"] == "unverified", "Candidates must never appear as verified"
    assert urlparse(item["discoveryUrl"]).scheme == "https"
    assert item["title"] and item["publisher"]
assert h["status"] in {"not_run", "healthy", "degraded"}
assert isinstance(h["sources"], dict)
print("PASS: unverified discovery queue and health metadata")
