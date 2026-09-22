## Context

The repository has no application code or existing specs. The README describes a CSV-driven volleyball analysis app; the planning log narrows the MVP to one manually prepared CEV-like CSV per match. See `proposal.md` and the two delta specs for user-visible behavior.

## Goals / Non-Goals

**Goals:**

- Keep parsing, validation, calculations, and presentation separate so a malformed file cannot produce a plausible but wrong report.
- Make the CSV easy to prepare by hand: one header, one match row, then player rows, with the score written only once.
- Run locally without a server or internet connection after the app files are available.

**Non-Goals:**

- Scraping CEV pages, supporting arbitrary CEV exports, persisting a match library, or comparing matches.
- Reconstructing exact reception quality counts from rounded CEV percentages.

## Decisions

### Local static browser app

Implement the MVP as HTML, CSS, and JavaScript opened locally in a browser. Read the selected CSV through the browser file picker and keep the data in memory. This matches the requested match screen and player selection without adding a service or account system. A Python or server-backed UI would add setup and deployment work for a one-file import flow.

### Explicit row types and fixed columns

Use the exact columns from `match-csv-import/spec.md`. A `match` row uses `team_1`, `team_2`, and set score columns; `player` rows use `team`, `player`, and statistic columns. Empty cells in the other row type are expected. Set columns for unplayed sets are blank. Parse quoted CSV fields correctly so names can contain commas. Require zero as `0` for applicable count fields, while reception quality percentages are blank when there are no receptions.

This uses one rectangular CSV instead of two separate files or free-form report sections. It gives the user a single upload and lets the importer identify the score row without repeating it for every player.

### Derived values and validation boundary

Validate the whole file before replacing the displayed match. Derive the final set score from set point winners. Check player point components and attempt/error constraints, and show row and column names for failures. Calculate rates from raw counts and present unavailable rates when attempts are zero. Keep CEV positive and excellent reception percentages as source values; do not average them into team percentages.

Keep `points` in player rows even though it can be derived from attack points, serve aces, and block points. It mirrors the CEV row and provides a consistency check. Team player-point totals can differ from set point totals because opponent errors can score points without being attributed to a player.

### Example and documentation

Provide a sample CSV using the linked CEV match (VakifBank Istanbul versus Conegliano, 2 May 2026), with the five set scores and selected player rows, including Tijana Bošković. Label the sample as a subset of players so its team sums are not mistaken for the official full-match totals. Document every column, blank-versus-zero rules, and the success and efficiency formulas in the README.

## Risks / Trade-offs

- **Manual transcription mistakes** → Reject inconsistent values, include a checked sample, and report the offending row and field.
- **Rounded CEV reception percentages** → Display the copied percentages without trying to reconstruct counts or team quality rates.
- **Source naming differences** → Treat the documented CSV as the supported format; manual conversion handles CEV page variations in this MVP.
- **Browser-only local data** → A newly loaded match replaces the current report; users keep the CSV as their durable copy.
