## Why

The project needs a small, reliable way to turn manually prepared volleyball match data into a useful report. A fixed CSV format makes the first version testable without depending on CEV page structure or an internet connection.

## What Changes

- Define one CSV file containing a single match row and one row per player, distinguished by `row_type`.
- Load and validate one match at a time, including both teams, each set's points, and the core player statistics.
- Show the final set score, set points, team summaries, and selectable player statistics. Calculate rates from counts where possible; show CEV reception quality percentages as supplied.
- Document the CSV columns and calculation rules, with a sample based on the referenced CEV match.
- Keep direct CEV URL importing and comparisons across matches outside this MVP.

## Capabilities

### New Capabilities

- `match-csv-import`: Parse and validate the agreed single-match CSV format.
- `match-statistics-report`: Calculate and display the one-match score and core team and player statistics.

### Modified Capabilities

None. There are no existing specs.

## Impact

This is a greenfield project with a README and no application code. Implementation will add a local CSV loading flow, a match report interface, example data, tests, and documentation. The README's first-version description will need to reflect the agreed one-match scope.
