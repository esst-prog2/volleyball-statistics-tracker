## Why

The original README opening lacks a screenshot sequence for the five-minute presentation. The user now selects two real Scandicci–VakifBank matches so the demo also demonstrates the existing cross-match player comparison using reproducible source data.

## What Changes

- Replace the README opening with six present-tense sentences following import → Final score → Team statistics → Players → Saved matches → Compare a player across matches.
- Use CEV matches 82223 (8 January 2026, Scandicci 1–3 VakifBank) and 82229 (4 February 2026, VakifBank 3–2 Scandicci).
- Preserve both public HTML reports retrieved on 2026-11-07 and provide full-match CSV fallback files containing 28 players each.
- Compare MARKOVA Marina: 21 versus 32 points; attack success 43.2% versus 55.6%; efficiency 22.7% versus 35.2%; reception error rate 11.4% versus 2.6%.
- Use a screenshot of both comparison rows in the presentation; distinguish save timestamps from actual match dates. No PowerPoint artifact is created by this documentation change.

## Capabilities

### New Capabilities

None. Documentation only; skip_specs is true.

### Modified Capabilities

None. This change does not alter program behavior. The existing match-statistics-report specification prohibits cross-match comparison, while the implemented app already supports it; reconciling that earlier mismatch is outside this demo-description update.

## Impact

README.md opening paragraph, two HTML source snapshots, two full-match CSV samples, this OpenSpec change, and PLANNING_LOG.md. No code, API, dependency, or runtime changes.
