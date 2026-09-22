# Volleyball Statistics Tracker & Match Analyzer

A local, offline match report for a CSV that you prepare from a volleyball match report. The MVP loads **one match at a time** and shows its score, set scores, team totals, and player statistics. It does not import a CEV URL or compare matches yet.

## Run the MVP

Open `index.html` in a modern browser, choose a CSV file, and select a player to see their details. No server, account, installation, or internet connection is needed. `samples/cev-82293-selected-players.csv` is a small example based on [CEV match 82293](https://www-old.cev.eu/Competition-Area/MatchStatistics.aspx?ID=82293). It includes selected players from both teams, so its calculated team totals are **partial**, not the official full-team totals.

Run the checks with `npm test` (Node.js 20 or newer).

## CSV format

Use UTF-8 CSV with one header row. Column order can vary, and extra columns are ignored. The file has exactly one `match` row and one or more `player` rows. All rows use the same header. Write `0` for a measured count of zero; an empty cell means the value does not apply to that row type. Do not add CEV team-total or set-summary rows as players.

| Column | `match` row | `player` row |
| --- | --- | --- |
| `row_type` | `match` | `player` |
| `team_1`, `team_2` | Two distinct team names | Blank |
| `set_1_team_1`, `set_1_team_2` through `set_5_team_1`, `set_5_team_2` | Each played set's points, in team 1 / team 2 order; leave later unplayed sets blank | Blank |
| `team`, `player` | Blank | Team name matching one match team; player name |
| `points` | Blank | Player's total points |
| `serve_attempts`, `serve_errors`, `serve_aces` | Blank | Serve counts |
| `reception_attempts`, `reception_errors` | Blank | Reception counts |
| `reception_positive_pct`, `reception_excellent_pct` | Blank | Copy CEV's reported numbers without `%`; leave blank if reception attempts are zero |
| `attack_attempts`, `attack_errors`, `attack_blocked`, `attack_points` | Blank | Attack counts; `attack_points` means successful attacks |
| `block_points` | Blank | Points scored by blocks |

For an unplayed set, leave **both** set columns blank. A played set needs two different nonnegative point values. Three to five consecutive sets must give exactly one team three set wins. Each team should have at least one player row. Player counts must be nonnegative whole numbers. A player's `points` must equal `serve_aces + attack_points + block_points`; the app checks this and other consistency rules before showing a report.

The sample file has one match row with VakifBank's five set scores `22, 18, 29, 25, 15` and Conegliano's `25, 25, 27, 23, 11`. Its Tijana Bošković row includes 34 points, 63 attack attempts, 33 attack points, two attack errors, two blocked attacks, and one block point.

## Calculations

- Final match score: count the sets won by each team from the set point values.
- Attack success: `attack_points / attack_attempts × 100`.
- Attack efficiency: `(attack_points - attack_errors - attack_blocked) / attack_attempts × 100`.
- Reception error rate: `reception_errors / reception_attempts × 100`.
- Team totals: sum player counts. Team rates use the summed counts, never an average of player percentages.

A rate with zero attempts is shown as unavailable. CEV positive and excellent reception percentages are displayed exactly as entered; the app does not derive their underlying counts or combine the rounded player percentages into a team quality percentage. Team **player points** may be lower than the team's set-point total because opponent errors can award points without crediting a player.

## Scope

This first version uses manually prepared CSV files and works offline. Later versions may compare players across matches or import CEV pages directly. Live match tracking, video analysis, mobile apps, accounts, online sharing, predictions, and professional-system replacement are outside the current scope.

The [planning log](PLANNING_LOG.md) records project decisions, and [OpenSpec](openspec/changes/one-match-csv-report/proposal.md) contains the MVP requirements and implementation plan.
