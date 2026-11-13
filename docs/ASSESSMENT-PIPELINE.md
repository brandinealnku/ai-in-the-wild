# AI-assisted evidence assessment — gated research drafts

Workflow: daily candidate discovery → related coverage search → retrieve up to three accessible article pages → AI extraction (optional, API key required) → validate verbatim evidence excerpts → unapproved draft record → human reviewer.

## Setup
In repository **Settings → Secrets and variables → Actions**, create `OPENAI_API_KEY` (the secret is never placed in the source files). GitHub Actions uses `gpt-4.1-mini` by default, overridable using an environment variable. The OpenAI API can incur usage costs. Each run assesses at most three candidates by default, capped at five with `ASSESSMENT_MAX_PER_RUN`. No AI is called when the key is missing; drafts are explicitly marked `needs_configuration`.

The job is tied to the daily discovery workflow and can also be started manually from Actions. **Source access may be blocked** by paywalls, Google News redirection, bots or publisher controls. If sources are inaccessible, the draft is `insufficient_source_access` and does not make substantive claims.

## Checks
- Candidate headlines and Google News RSS searches supply *research leads*, never verification.
- Up to three accessible distinct-text HTML sources can be read transiently, but **full article text is never committed**.
- Drafts record linked source URLs and content hashes; exact excerpts cannot exceed 180 characters and must appear verbatim in retrieved source text. These excerpts require editorial/licensing review before reuse.
- Numeric claims preserve reported value, units, denominators, periods, source, and limitations. Model-generated `cross_checked` labels are downgraded to `reported_only` until independent human verification.
- Contradictory evidence must contain an exact source excerpt that directly conflicts with a material claim; silence or skepticism is not a contradiction.
- AI provides candidate assessments, not automatic certification. Missing evidence, unknown status, and failed LLM calls are surfaced rather than guessed.
- Draft output: `data/assessment-drafts.json`; health: `data/assessment-health.json`. Both live in this **public repository** and may be viewed by anyone. Do not place secrets, confidential data, student information, or internal company records in public source feeds.

## Human publication gate
Inspect draft source material and verify against current primary sources, manually check metrics and contradictory reporting, record reviewer decision, then independently update `data/cases.json`. This workflow has no code path to write approved cases. A model result is never sufficient approval. Preserve the historical published board edition during testing.

## Operational limitations
The current workflow is a research prototype. It does not guarantee all relevant businesses or sources are found, and inaccessible articles do not provide negative evidence. No evidence quality score or formal source independence test should be assumed. Production hardening should add a private review interface, robust article access via permitted APIs, budget monitoring, and longer-term retention policy.
