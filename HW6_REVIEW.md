# HW6 — Code Review Log

## Review 1: Specification Compliance

**Focus:** Check whether the implementation follows the OpenSpec requirements, especially how the CEV importer handles incomplete or changed HTML.

### What I found

While reviewing `src/cev.js`, I noticed that the parser skipped rows when it could not recognize a player name identifier. This could cause a player to disappear from the imported statistics without showing an error.

The CEV import specification requires malformed player rows to be rejected instead of silently ignored.

### What I changed

- Added a regression test in `tests/cev.test.js` that changes a player's name identifier.
- Updated `src/cev.js` to reject full statistics rows with unrecognized player identifiers.
- Kept an exception for the legitimate "Team Totals" summary row, which should not be treated as an individual player.

### Verification

The first fix revealed that real CEV pages also contain a 24-column "Team Totals" row. I adjusted the parser to handle that case.

After the correction:

- All 7 CEV tests passed.
- All 22 project tests passed.
- The JavaScript syntax check passed.
- `git diff --check` reported no problems.

**Result:** Fixed a specification-compliance issue without breaking the existing CEV match import tests.

## Review 2: Unrequested Features and Unnecessary Complexity

**Focus:** Compare the repository with the OpenSpec requirements and look for unrequested features, duplicated functionality, and unnecessary complexity.

### What I found

I reviewed the three current OpenSpec specifications, archived design decisions, application HTML and CSS, `src/app.js`, `src/core.js`, `src/cev.js`, `server.js`, tests, package configuration, samples, and the saved CEV comparison spike.

The main functionality has a documented purpose: CEV importing, CSV fallback, one-match reporting, team totals, player selection, and calculated rates are required. The local server and bounded retrieval support the CEV importer. The saved comparison spike is documented verification evidence, not an additional application feature. I found no clearly unrequested feature or duplicated feature implementation requiring removal. The importer also reuses CSV validation rather than maintaining separate statistical validation rules.

In `src/app.js`, however, `currentMatch` was unnecessary mutable state. It was assigned in `showMatch`, read only within that same function, and reset in `clearReport`. The function already receives the match as a parameter, and player-selection callbacks receive it directly.

### What I changed

- Removed the redundant `currentMatch` variable and its assignments.
- Passed the existing `match` parameter directly to the score, team, and player render functions.

### Verification

- All 22 project tests passed, with 0 failures, after allowing the local port access required by the server tests. The initial sandboxed run passed 18 tests and failed 4 because binding to `127.0.0.1` was prohibited.
- `node --check src/app.js` passed.
- `git diff --check` passed.
- Inspected all references to confirm no code outside `showMatch` depended on `currentMatch`.
- The existing automated suite covers parsing, calculations, and server behavior; browser UI interaction was not tested in this review.

**Result:** Simplified report rendering by removing redundant state. No unrequested application feature was found.

## Review 3: Duplicate Implementations, Dead Code, and Dependencies

**Focus:** Examine the whole repository for unused functions, duplicated logic, obsolete files, and unnecessary dependencies.

### What I found

I checked function definitions and references in the application, server, tests, and comparison spike; the HTML and dynamically generated CSS classes; package configuration; samples and fixtures; documentation; and current and archived OpenSpec files.

- No unused JavaScript function, variable, or import requiring removal was identified. Parsing helpers, rate calculations, rendering helpers, and server helpers all have callers; imported modules and local variables support those paths.
- `.upload-card p` in `src/styles.css` was a dead selector: neither `index.html` nor the JavaScript rendering code creates that class.
- CSV and CEV imports share statistical validation and the report renderer. The repeated team and player statistic sections have different fields and presentation, so a new abstraction was not justified for this review.
- The test CSV-escaping helper and the spike's small HTML parser resemble production code, but serve test-input construction and independent TOTAL-row comparison respectively. They are not duplicate application features.
- Samples and fixtures are referenced by tests or documentation. The saved spike script, raw input, and generated comparison files preserve a reproducible verification result. Archived OpenSpec files preserve design history. No tracked file was identified as obsolete and safe to delete.
- `package.json` declares no third-party dependencies or development dependencies. Node.js built-ins and browser APIs provide the runtime functionality.

### What I changed

- Removed the unused `.upload-card p` selector from its shared CSS rule, preserving the declarations for the remaining selectors. This cleanup was committed in `578a37f`.
- Rechecked the findings against the active OpenSpec specifications and Session 6 guidance. No further code changes were justified. Updated this section to use the requested title and record the complete verification.

### Verification

- Confirmed there are no `upload-card` references in the application HTML or JavaScript.
- All 22 project tests passed, with 0 failures.
- `node --check` passed for all 8 tracked JavaScript files (application, server, tests, and comparison spike).
- `git diff --check` passed.
- Browser visual interaction was not tested; the removed selector had no matching application element.

**Result:** Removed dead styling. No unused JavaScript functions, unnecessary dependencies, obsolete tracked files, or duplicate application implementations requiring removal were identified.

## Review 4: Error Handling and Quiet Defaults

**Focus:** Review silent failures, defaults that hide missing data, catch boundaries, CEV validation, failed-import report clearing, and public server error messages against Session 6 guidance and the active OpenSpec specifications.

### What I inspected and found

I inspected the CSV parser and statistical validation in `src/core.js`, CEV parsing in `src/cev.js`, retrieval and HTTP error handling in `server.js`, both import handlers in `src/app.js`, the HTML report container, tests and fixtures, saved real CEV inputs, the comparison spike, and the active import/report specifications.

- `countValue` accepted an empty or whitespace-only CEV count cell as zero. This could turn missing reception attempts into a plausible zero and pass shared statistical validation. The active specification explicitly identifies `.` and `-` as legitimate placeholders. Neither saved real-match page (82294 or 82295) contains blank player count cells in the imported fields.
- No empty catch block was found. CSV parsing failures become validation errors; URL/JSON decoding failures become explicit rejection; unsafe static paths return 404. The comparison spike throws on missing tables, rows, and invalid CSV instead of continuing with an empty result.
- Browser import catches display errors, and the retrieval catch preserves known `CevImportError` values and distinguishes timeout from retrieval failure. The HTTP boundary returns known import errors and a generic message for unexpected exceptions rather than exposing stacks. The retrieval catch is broad and also covers parsing, but it still rejects the import; no catch-boundary refactor was needed for this focused fix.
- Both import handlers call `clearReport` before awaiting retrieval or file reading. Invalid CSV results and failed CEV requests do not call `showMatch`. This confirms the ordinary sequential failed-import path by inspection; concurrent imports and browser interaction were not exercised in this review.
- Blank later set scores represent unplayed sets and remain subject to match validation. Zero-attempt rates remain unavailable. Empty reception-quality values when attempts are zero remain unavailable. These defaults have legitimate meanings and were preserved.

### What I changed

- Restricted CEV count normalization to explicit `.` and `-` placeholders. Blank count cells now raise a field- and player-specific `format_changed` error.
- Added a regression test for a blank reception-attempt cell that previously passed as zero, plus coverage preserving both legitimate count placeholders and unavailable no-attempt rates.
- Added endpoint coverage confirming missing counts return an import error without a partial match, and upstream exceptions do not expose their private messages or stacks.

### Verification

- Before the fix, the blank-count regression failed with “Missing expected exception,” demonstrating the quiet default.
- After the fix, `npm test` passed all 25 tests, with 0 failures, including the existing saved real-match test.
- `node --check` passed for all 8 tracked JavaScript files; the endpoint test file was checked again after adding its new test.
- `git diff --check` passed.
- Browser interaction and live CEV retrieval were not tested; automated checks use saved inputs and injected retrieval responses.

**Result:** Missing CEV counts are rejected rather than silently replaced with zero, while legitimate placeholders and required import behavior are preserved.
