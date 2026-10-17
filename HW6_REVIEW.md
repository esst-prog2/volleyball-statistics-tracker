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
