#!/usr/bin/env python3
"""Fail-closed schema check for unapproved evidence review drafts."""
import json
from pathlib import Path
from urllib.parse import urlparse
root=Path(__file__).resolve().parents[1]
d=json.loads((root/"data/assessment-drafts.json").read_text(encoding="utf-8"))
h=json.loads((root/"data/assessment-health.json").read_text(encoding="utf-8"))
assert d.get("schemaVersion")==h.get("schemaVersion")==1
assert isinstance(d.get("drafts"),list) and len(d["drafts"])<=100
assert h.get("publicationBlocked") is True
seen=set()
states={"needs_configuration","insufficient_source_access","assessment_error","needs_human_review"}
for draft in d["drafts"]:
    assert draft["candidateId"] not in seen
    seen.add(draft["candidateId"])
    assert draft["status"] in states
    assert draft.get("reviewStatus")=="unapproved"
    assert draft.get("publicationBlocked") is True
    assert draft["assessment"]["reportedOutcome"] in ("Positive","Mixed","Negative","Unknown")
    for s in draft.get("sourceReferences",[]):
        assert s["sourceId"].startswith("S")
        assert urlparse(s["url"]).scheme=="https"
    for claim in draft["assessment"]["numericClaims"]:
        assert claim["validationStatus"] in ("reported_only","contradicted","unverified"), "Automatic corroboration must never be certified"
print(f"PASS: {len(seen)} drafts remain unapproved")
