## 1. CSV contract and example

- [x] 1.1 Document every CSV column, row type, blank-versus-zero rule, and calculation formula in README.md; verify a reader can create one match row and player rows from the instructions.
- [x] 1.2 Add a sample CSV from CEV match 82293 with its five set scores and selected player rows from both teams; verify each copied value against the source page and label team sums as partial.

## 2. Import and validation

- [x] 2.1 Add a quoted-field-aware UTF-8 CSV parser and row-type mapper; verify tests cover column reordering, quoted commas, and unknown extra columns.
- [x] 2.2 Validate the single match row, consecutive set scores, and derived three-set winner; verify tests accept a valid five-set match and reject incomplete or inconsistent scores.
- [x] 2.3 Validate player rows, required counts, team membership, duplicates, reception percentages, and points arithmetic; verify tests identify the bad row and field and cover zero-versus-blank cases.

## 3. Match report

- [x] 3.1 Build the local file picker and match result view; verify a valid CSV displays both teams, the derived final set score, and all played set points without network access.
- [x] 3.2 Build team summaries from player counts; verify summed values and team attack rates against a checked fixture, with player points clearly labeled.
- [x] 3.3 Build the player list and detail view; verify selecting Tijana Bošković shows her copied counts, supplied reception percentages where applicable, and correctly calculated attack rates.
- [x] 3.4 Handle file replacement and import errors; verify a second valid CSV replaces the first and an invalid CSV shows row/field errors without displaying invalid match data.

## 4. MVP verification

- [x] 4.1 Run the importer and report tests and manually load the sample CSV in the browser; verify the one-match workflow, zero-attempt displays, and the documented calculations end to end.
