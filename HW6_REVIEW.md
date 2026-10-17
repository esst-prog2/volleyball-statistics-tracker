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
