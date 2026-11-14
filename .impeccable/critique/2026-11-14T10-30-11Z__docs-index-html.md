---
target: promo page
total_score: 19
max_score: 28
na_heuristics: 1,7,9
p0_count: 0
p1_count: 2
target_identity: "file:/Users/macuser/Documents/course/volleyball-statistics-tracker/volleyball-statistics-tracker/docs/index.html"
target_fingerprint: "sha256:cd46e03ef03e271dc1843f2a65ec9ab3e62127b1303b099659cd91d1be68d2ac"
target_path: /Users/macuser/Documents/course/volleyball-statistics-tracker/volleyball-statistics-tracker/docs/index.html
timestamp: 2026-11-14T10-30-11Z
slug: docs-index-html
---
# Promo page critique — 2026-11-14

Target: docs/index.html, accepted compact variant 3.
Provenance: two isolated Impeccable assessment agents; Assessment A reviewed design and personas, Assessment B ran the detector and checked anchors and source links. Source-only review: browser automation was unavailable. No rendered mobile or desktop QA is claimed.

## Assessment before fixes

Design health: 19/28 (68%, acceptable). Product-specific content and evidence are strong; visual language is conventional.

| Heuristic | Score |
| --- | --- |
| System status | n/a — static page |
| Real-world language | 3/4 |
| User control | 3/4 |
| Consistency | 3/4 |
| Error prevention | 3/4 |
| Recognition over recall | 2/4 |
| Flexibility and efficiency | n/a — persuade surface |
| Aesthetic focus | 3/4 |
| Error recovery | n/a — no operation/error states |
| Help and documentation | 2/4 |

Strengths: real named-player comparison, dated source links, metric definitions, restrained claims, clear reading order and lightweight page.

Cognitive load: moderate. Setup combines unfamiliar tools, two filenames and a player selector. Five comparison columns compete before the definitions. No decision point has more than four competing actions.

Emotional journey: curiosity at the opening, trust in the evidence, friction at local setup.

## Priorities and persona red flags

- **Weakest part, P1 — novice setup:** a stranger/fan may stop at Node.js and terminal instructions. A classmate can probably proceed but still cannot inspect the app before setup. Fix with a Node.js download link, explicit desktop/laptop requirement, a terminal-help disclosure and separate import/compare steps.
- **P1 — phone comparison:** a wide scrollable table loses context and lacks a focus indicator on its region. Fix with labeled, stacked match rows on mobile and explicit region focus styling.
- **P2 — story takeaway:** a teacher can verify the numbers but must infer the meaning. Fix by stating that attack success goes from 43.2% to 55.6%, meaning a higher share of attacks scores in the second match. Do not claim a trend.

Minor observation: the app palette is consistent but visually generic. Preserve the user's accepted compact layout rather than reopening visual direction.

## Detector evidence

Before and after fixes: 0 errors, 1 warning (`cramped-padding`, section.how, reported line 0). This is a source-scan false positive: the section has explicit 40px top and bottom padding. No detector-driven design change is warranted.

Internal anchors are unique and resolve. CEV match links match the included samples. The README setup fragment matches its heading. External availability was not part of the source review.

## Applied fixes and verification

All three priorities above were addressed without changing the chosen variant. Terminal instructions are hidden behind a labeled disclosure; mobile match rows retain the date and every metric label. Temporary preview instrumentation is absent from the deployment directory. One-time checks verify anchors, comparison values against CSV counts, no helper credentials, and only intended public files in docs/.

Questions skipped: the user already authorized critique, necessary fixes, and GitHub Pages publication.
