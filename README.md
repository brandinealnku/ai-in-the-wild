# AI in the Wild — Business AI Observatory

Board edition baseline · November 12, 2026.

This is a curated, nonrepresentative snapshot of business AI cases, not an automatically refreshed news feed. The dashboard preserves the dark visual design, Professional/Learning views, search, industry/outcome filters, and evidence detail cards.

## Run
Serve this directory with `python3 -m http.server 8000` and open http://localhost:8000. GitHub Pages can publish the files from main / root.

## Data and publication
`data/cases.json` holds case records. Only `review_status: approved` records are displayed; material outcome claims are attributed to sources and are not automatically independently verified. A GitHub validation workflow runs on pushes and pull requests, **not** daily discovery. No data ingestion pipeline, autonomous publishing, or API secrets have been enabled.

## Validate
`python3 scripts/validate_cases.py`

## Next release
Add private candidate staging, daily discovery, deduplication, source health, claim-evidence traceability, and manual approval before records reach public JSON. Do not treat case counts as a representative sample or vendor estimates as audited ROI.
