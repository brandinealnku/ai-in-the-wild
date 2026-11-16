#!/usr/bin/env python3
"""Validate language corpus metadata, keeping source coverage explicit."""
from pathlib import Path
import json
from urllib.parse import urlparse
p=Path(__file__).resolve().parents[1]/"data"/"studies-language.json"
d=json.loads(p.read_text(encoding="utf-8"))
assert d["schemaVersion"]==1
assert d["coverage"]=="title_and_abstract_only"
assert "global" in d["rankScope"] or "only" in d["rankScope"]
assert isinstance(d["studies"],list)
seen=set()
for s in d["studies"]:
 assert s["doi"] not in seen and urlparse(s["doi"]).scheme=="https"
 seen.add(s["doi"])
 assert s["textCoverage"]=="title_and_abstract"
 assert isinstance(s["citedByCount"],int) and s["citedByCount"]>=0
 assert isinstance(s["tokenCounts"],dict) and s["tokenCounts"]
 assert all(isinstance(v,int) and v>0 for v in s["tokenCounts"].values())
 assert sum(s["tokenCounts"].values())==s["tokenTotal"]
print("PASS:",len(seen),"selected DOI-indexed studies")
