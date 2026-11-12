#!/usr/bin/env python3
"""Daily discovery of *candidates* for human evidence review.

Sources are discovery pointers, NOT corroborated case studies. Never edits data/cases.json.
Stdlib-only to keep scheduled operations simple and auditable.
"""
from __future__ import annotations
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from hashlib import sha256
import json
import os
from pathlib import Path
import re
import sys
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
CANDIDATES = ROOT / "data" / "candidates.json"
HEALTH = ROOT / "data" / "discovery-health.json"
CASES = ROOT / "data" / "cases.json"
UTC = timezone.utc
MAX_AGE_DAYS = 45
MAX_CANDIDATES = 300
QUERIES = {
    "enterprise-deployments": '"AI" "company" "deployment" business',
    "measurable-results": '"AI" "productivity" "company" results',
    "failures-incidents": '"AI chatbot" "wrong" OR "failed" business',
    "health-finance": '"generative AI" healthcare OR banking deployment',
    "manufacturing-retail": '"AI" manufacturing OR retail "case study"',
    "agentic-workflows": '"AI agents" "enterprise" deployment',
}

def timestamp():
    return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")

def load(path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return default

def save_atomic(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    tmp.replace(path)

def normalize_title(text):
    text = re.sub(r"\s+-\s+[^-]{1,65}$", "", text or "")
    return re.sub(r"\s+", " ", text).strip()

def fingerprint(title):
    key = re.sub(r"[^a-z0-9]+", " ", title.casefold()).strip()
    return "candidate-" + sha256(key.encode("utf-8")).hexdigest()[:16]

def published_at(text):
    try:
        dt = parsedate_to_datetime(text)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=UTC)
        return dt.astimezone(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    except (ValueError, TypeError, IndexError):
        return ""

def research_hint(title):
    s = title.lower()
    if re.search(r"\b(fail|error|hallucinat|bias|lawsuit|mislead|shut down|wrong)\b", s):
        return "Possible adverse outcome — verify with primary evidence"
    if re.search(r"\b(roi|percent|revenue|saved|hours|cost|million|billion)\b|[%$]", s):
        return "Possible measurable claim — locate methodology and denominator"
    return "Unclassified — identify actual business workflow and deployment status"

def discover(query):
    url = "https://news.google.com/rss/search?" + urlencode({
        "q": query + " when:30d",
        "hl": "en-US", "gl": "US", "ceid": "US:en"
    })
    request = Request(url, headers={"User-Agent": "AI-in-the-Wild-research/0.1 (+github.com/brandinealnku/ai-in-the-wild)"})
    with urlopen(request, timeout=25) as res:
        if len(res.read(1)) == 0:
            raise ValueError("Empty response")
        # Re-fetch to enforce bounded read using a single parser input.
    with urlopen(request, timeout=25) as res:
        data = res.read(2_000_001)
        if len(data) > 2_000_000:
            raise ValueError("RSS response exceeds size limit")
    root = ET.fromstring(data)
    if root.tag != "rss":
        raise ValueError("Unexpected feed format")
    items = []
    for item in root.findall("./channel/item")[:60]:
        title = normalize_title(item.findtext("title", "") or "")
        link = (item.findtext("link", "") or "").strip()
        pub = published_at(item.findtext("pubDate"))
        source = item.find("source")
        publisher = source.text.strip() if source is not None and source.text else "Unknown publisher"
        if not title or not link or urlparse(link).scheme != "https":
            continue
        if pub:
            dt = datetime.fromisoformat(pub.replace("Z", "+00:00"))
            if dt < datetime.now(UTC) - timedelta(days=MAX_AGE_DAYS):
                continue
        items.append((title, link, pub, publisher))
    return items

def run():
    now = timestamp()
    old = load(CANDIDATES, {"schemaVersion": 1, "candidates": []})
    old_health = load(HEALTH, {"sources": {}})
    approved = load(CASES, {"cases": []}).get("cases", [])
    existing_titles = {re.sub(r"[^a-z0-9]+", " ", x.get("title", "").casefold()).strip() for x in approved}
    queue = {c["id"]: c for c in old.get("candidates", []) if c.get("id")}
    source_health = {}
    success = 0
    created = 0
    for name, query in QUERIES.items():
        try:
            items = discover(query)
            success += 1
            added_here = 0
            for title, link, pub, publisher in items:
                normalized = re.sub(r"[^a-z0-9]+", " ", title.casefold()).strip()
                if normalized in existing_titles:
                    continue
                cid = fingerprint(title)
                if cid in queue:
                    queue[cid]["lastSeen"] = now
                    continue
                queue[cid] = {
                    "id": cid, "title": title, "publisher": publisher,
                    "discoveryUrl": link, "publishedAt": pub,
                    "firstSeen": now, "lastSeen": now,
                    "sourceQueries": [name],
                    "status": "needs_review", "evidenceStatus": "unverified",
                    "suggestedReview": research_hint(title),
                    "note": "Discovery pointer only. Full article, primary sources, deployment, metrics and permissions have NOT been verified."
                }
                created += 1
                added_here += 1
            source_health[name] = {
                "success": True, "checkedAt": now, "lastSuccessAt": now,
                "recordsSeen": len(items), "newCandidates": added_here,
                "note": "Google News RSS discovery; not primary evidence."
            }
        except Exception as e:
            prior = old_health.get("sources", {}).get(name, {})
            source_health[name] = {
                "success": False, "checkedAt": now,
                "lastSuccessAt": prior.get("lastSuccessAt"),
                "recordsSeen": 0, "newCandidates": 0,
                "error": type(e).__name__ + ": " + str(e)[:150]
            }
    if success == 0:
        print("All discovery feeds failed. Existing dataset preserved.", file=sys.stderr)
        sys.exit(1)
    items = sorted(queue.values(), key=lambda x: x.get("firstSeen", ""), reverse=True)
    # Keep reviewed items only while capacity allows; never overwrite approved case records.
    items = items[:MAX_CANDIDATES]
    stats = {key: sum(c.get("status") == key for c in items) for key in ("needs_review", "reviewed", "dismissed")}
    save_atomic(CANDIDATES, {"schemaVersion": 1, "lastDiscoveryAt": now, "candidates": items})
    save_atomic(HEALTH, {
        "schemaVersion": 1, "checkedAt": now,
        "status": "healthy" if success == len(QUERIES) else "degraded",
        "sourceSuccessCount": success, "sourceTotal": len(QUERIES),
        "newCandidates": created, "totalCandidates": len(items),
        "pendingReview": stats["needs_review"],
        "sources": source_health,
        "disclaimer": "Daily discovery is not evidence verification. Nothing here is automatically approved or published as a verified case."
    })
    print(f"Discovery checked {success}/{len(QUERIES)} feeds; {created} new; {len(items)} candidates; status {stats}.")

if __name__ == "__main__":
    run()
