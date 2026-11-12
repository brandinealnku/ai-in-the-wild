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

## Phase 2: Daily discovery (enabled in GitHub Actions)

- Workflow: [Daily AI case discovery](.github/workflows/daily-discovery.yml), scheduled at 12:23 UTC daily (7:23 a.m. EST / 8:23 a.m. EDT); also supports manual **Run workflow**.
- Discovery-only feeds: six Google News RSS searches for business deployments, measured results, failures, sector examples and agents. These are *leads*, not validated evidence or licensed bulk datasets.
- Output: `data/candidates.json` (unverified review queue) and `data/discovery-health.json` (source availability and last check). Neither changes the vetted `data/cases.json`.
- Validation: `python3 scripts/validate_discovery.py` and `python3 scripts/validate_cases.py`.
- Approval policy: [Evidence review standards](docs/EVIDENCE-REVIEW.md). Publishing an approved case is a separate manual, documented action.
- First run: use **Actions → Daily AI case discovery (review queue only) → Run workflow**. Check the run logs and the pipeline status panel after GitHub Pages rebuilds. Before the first run, the dashboard correctly says **Not run yet**.
- Caveat: the scheduled discovery workflow is committed, but a successful live scheduled or manual execution has not yet been independently observed. AI-based claim verification, link verification, source licensing checks and automatic approved-case publication have not been implemented.
