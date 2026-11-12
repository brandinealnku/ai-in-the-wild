# Evidence review and publication gate

Daily discovery creates **unverified discovery pointers**, not validated AI use cases. Results from Google News RSS are leads only and may be duplicates, inaccessible, incorrect, promotional, irrelevant or simply mention AI rather than document an actual deployment.

## Human evidence-review procedure
1. Inspect `data/candidates.json`, choose a candidate and open its original news link.
2. Find the actual organization and underlying primary source (company disclosure, regulator, official audit, tribunal record, peer-reviewed study, first-party deployment record).
3. Verify the business workflow, production/pilot status, event and evidence dates. Record where the source supports *each* numeric or consequential claim.
4. Search for independent corroboration, subsequent corrections, later shutdowns and adverse effects.
5. Classify the outcome (Positive / Mixed / Negative / Unknown) separately from source confidence. A vendor-reported ROI is not independently audited.
6. Create an approved record in `data/cases.json` only after the actual source review. Each case requires `review_status: "approved"`, a direct HTTPS `source`, an honest `evidence` limitation, and a meaningful `risk` description.
7. Run `python3 scripts/validate_cases.py` and check the site in both viewing modes.
8. Preserve the original case when new evidence emerges; update it with a later source, rather than silently producing a duplicate.

**Not automatic:** Approval and publication. Daily discovery commits ONLY `data/candidates.json` and `data/discovery-health.json`. Do not publish candidate titles as verified cases.

## Governance
The board edition's 8 approved entries remain the sole public evidence library until reviewed additions are committed. `data/discovery-health.json` is a pipeline monitor, not a claims-verification certificate. A failed source retains previous candidates, and the pipeline reports degraded health. Google News feed licensing and source-specific reuse rights must be respected; store pointers and original summaries, not copied article bodies.
