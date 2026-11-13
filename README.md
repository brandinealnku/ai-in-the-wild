# AI in the Wild — Business AI Observatory

Board edition baseline · November 12, 2026.

This is a curated, nonrepresentative snapshot of business AI cases, not an automatically refreshed news feed. The dashboard preserves the dark visual design, Professional/Learning views, search, industry/outcome filters, and evidence detail cards.

## Run
Serve this directory with `python3 -m http.server 8000` and open http://localhost:8000. GitHub Pages can publish the files from main / root.

## Data and publication
`data/cases.json` holds case records. Only `review_status: approved` records are displayed; material outcome claims are attributed to sources and are not automatically independently verified. A GitHub validation workflow runs on pushes and pull requests, **not** daily discovery. Daily discovery and gated assessment code are included; publishing is never automatic. API credentials must be added as GitHub Secrets to activate model extraction.

## Validate
`python3 scripts/validate_cases.py`

## Publication policy
No discovered or AI-assessed candidate is published as an approved case automatically. Do not treat case counts as a representative sample or vendor estimates as audited ROI. This repository is public; unapproved research drafts must not include secrets or confidential material.

## Phase 2: Daily discovery (enabled in GitHub Actions)

- Workflow: [Daily AI case discovery](.github/workflows/daily-discovery.yml), scheduled at 12:23 UTC daily (7:23 a.m. EST / 8:23 a.m. EDT); also supports manual **Run workflow**.
- Discovery-only feeds: six Google News RSS searches for business deployments, measured results, failures, sector examples and agents. These are *leads*, not validated evidence or licensed bulk datasets.
- Output: `data/candidates.json` (unverified review queue) and `data/discovery-health.json` (source availability and last check). Neither changes the vetted `data/cases.json`.
- Validation: `python3 scripts/validate_discovery.py` and `python3 scripts/validate_cases.py`.
- Approval policy: [Evidence review standards](docs/EVIDENCE-REVIEW.md). Publishing an approved case is a separate manual, documented action.
- First run: use **Actions → Daily AI case discovery (review queue only) → Run workflow**. Check the run logs and the pipeline status panel after GitHub Pages rebuilds. Before the first run, the dashboard correctly says **Not run yet**.
- Caveat: the scheduled discovery workflow is committed, but a successful live scheduled or manual execution has not yet been independently observed. AI-assisted extraction is implemented but needs the API secret and an observed successful run; independent claim verification, editorial source licensing checks and automatic approved-case publication are not implemented.

## Phase 2.1: AI-assisted evidence assessment

- Read-only review interface: [review.html](review.html) — on GitHub Pages, visit `/ai-in-the-wild/review.html`. It explicitly labels all records as **unverified**.
- Pipeline: [scripts/assess_evidence.py](scripts/assess_evidence.py) searches for related source material, retrieves limited HTML text where permitted, asks an LLM to extract source-linked claims and contradictory evidence, checks that short verbatim excerpts exist in retrieved text, and generates `proposedCase` editor drafts.
- Setup: add GitHub **Actions repository secret** `GEMINI_API_KEY`; the default API model is `gemini-2.5-flash-lite`. A free-tier Google AI Studio key is sufficient when available; do not link a billing account. If missing, drafts show `needs_configuration` and no AI call is made.
- Source accessibility is not guaranteed; paywalls, anti-bot controls, publisher terms, and redirect behavior may prevent assessment. Unavailable evidence is explicitly flagged rather than guessed.
- Output: `data/assessment-drafts.json`, `data/assessment-health.json`. Published `data/cases.json` is never modified by scheduled research.
- Safety and review details: [docs/ASSESSMENT-PIPELINE.md](docs/ASSESSMENT-PIPELINE.md).
- Run tests: `python3 -m unittest discover -s tests -p 'test_assess_evidence.py'`, `python3 scripts/validate_assessments.py`.
- **Verification status**: uploaded source and workflow files are confirmed in GitHub, but a successful live API-backed assessment and end-to-end GitHub Actions run are not yet confirmed.

### $0 assessment configuration (Google)

Use [Google AI Studio API keys](https://aistudio.google.com/apikey) to create a key in a free-tier project without billing linked. Add only `GEMINI_API_KEY` under GitHub Actions repository secrets. The pipeline permits only `gemini-2.5-flash-lite`, processes at most two draft assessments per run, and never switches to a paid model. Free-tier quotas may change. If a key is absent or a free-tier limit is hit, the dashboard stays available and case publication remains blocked. Free-tier submissions may be used by Google to improve its services; use public sources only.

## Research Intelligence Studio redesign (Nov 13, 2026)

Design brief: benchmark patterns supplied from Observable, Exploding Topics, Our World in Data, CB Insights, Similarweb, The Pudding, Gapminder and Climate TRACE. This implementation applies the patterns, rather than claiming affiliation or copying their interfaces.

**Implemented:** editorial hero, compact sourced signal cards, two linked distributions (outcome and business function), global industry/outcome/year/text filtering, separate Student and Professional interpretations, four views (Case cards, Compare table, Evidence ledger, Briefing), CSV export, and visible research/assessment pipeline health. All plotted counts come from approved records in `data/cases.json`. Changing filters coordinates the four research views; clicking distribution bars applies a related filter.

**Interpretation:** counts are library coverage, not measured business success rates or trend magnitudes. We do not graph mixed-unit reported metrics together, infer business-ROI totals, generate fake growth lines, or treat discovery candidates as approved use cases. Source dates and limitations are part of every record.

**Deferred:** saved research workspaces, natural-language semantic search, continuous trend curves, and one-click branded reports; those require evidence-quality and repeat-use validation before development. The previous eight-case evidence data and unapproved research queue remain unchanged.

**QA:** `node --check app.js` and `node --check review.js` are now included in CI, alongside existing Python validation. Browser/device usability and GitHub Pages published-build verification remain release checks; committing source code alone is not proof of a successful deployed UI.
