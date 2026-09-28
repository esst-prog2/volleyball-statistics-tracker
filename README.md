# Volleyball Statistics Tracker & Match Analyzer

A local application that imports a real CEV match-statistics page, validates its structure and values, and turns it into a clear one-match report. Paste a supported CEV URL to see the score, set results, team totals, and individual player statistics. A fixed CSV format remains available as an offline fallback.

## Run the application

Node.js 20 or newer is required. From the repository terminal, run:

```bash
npm start
```

Open the address printed in the terminal, normally <http://127.0.0.1:3000>. Paste a URL such as:

```text
https://www-old.cev.eu/Competition-Area/MatchStatistics.aspx?ID=82293
```

The application makes one request for that public report, parses both teams, and shows the result. Stop the server with **Control+C**. Opening `index.html` directly still permits CSV loading, but CEV importing requires `npm start` because the browser cannot reliably retrieve another site's page itself.

Run all automated checks with:

```bash
npm test
```

## Why the CEV importer is central

CEV reports contain useful real-match data, but their HTML structure belongs to an external website and can change. The project therefore has to validate the URL, retrieve the page safely, recognize its structure, normalize placeholders, map two player tables into one internal format, validate the statistics, and fail clearly when the source no longer matches expectations. This is the project's main technical risk and its main contribution.

The local server accepts only HTTPS URLs for `www-old.cev.eu/Competition-Area/MatchStatistics.aspx` with one numeric match `ID`. It does not act as a general proxy. Redirects are rejected, downloads have time and size limits, and incomplete pages do not produce partial reports.

## CEV field mapping

The importer reads CEV's match-level identifiers and each 24-cell player row:

| CEV report field | Internal value |
| --- | --- |
| `L_HomeTeam`, `L_GuestTeam` | Team names |
| `L_Set1` through `L_Set5` | Played set point pairs |
| `GV_elenco_casa`, `GV_elenco_fuori` | Home and away player tables |
| Points `Tot` | `points` |
| Serve `Tot`, `Err`, `Ace` | Serve attempts, errors, and aces |
| Reception `Tot`, `Err`, `Pos%`, `Exc.%` | Reception attempts, errors, and supplied quality percentages |
| Attack `Tot`, `Err`, `Blk`, `Exc.` | Attack attempts, errors, blocked attacks, and successful attacks |
| Block `Pts` | Block points |

CEV's `-` and `.` placeholders become zero for applicable counts. Reception quality remains unavailable when a player has no reception attempts. Every imported match then passes through the same consistency checks used by CSV import.

## CSV fallback format

`samples/cev-82293-selected-players.csv` is a small fallback example based on [CEV match 82293](https://www-old.cev.eu/Competition-Area/MatchStatistics.aspx?ID=82293). It contains selected players from both teams, so its calculated team totals are **partial**, not official full-team totals.

Use UTF-8 CSV with one header row. Column order can vary, and extra columns are ignored. The file has exactly one `match` row and one or more `player` rows. Write `0` for a measured count of zero; an empty cell means the field does not apply to that row type. Do not add CEV team-total or set-summary rows as players.

| Column | `match` row | `player` row |
| --- | --- | --- |
| `row_type` | `match` | `player` |
| `team_1`, `team_2` | Two distinct team names | Blank |
| `set_1_team_1`, `set_1_team_2` through `set_5_team_1`, `set_5_team_2` | Each played set's points; later unplayed sets are blank | Blank |
| `team`, `player` | Blank | Match team and player name |
| `points` | Blank | Player's total points |
| `serve_attempts`, `serve_errors`, `serve_aces` | Blank | Serve counts |
| `reception_attempts`, `reception_errors` | Blank | Reception counts |
| `reception_positive_pct`, `reception_excellent_pct` | Blank | Supplied percentages without `%`; blank if attempts are zero |
| `attack_attempts`, `attack_errors`, `attack_blocked`, `attack_points` | Blank | Attack counts; `attack_points` means successful attacks |
| `block_points` | Blank | Points scored by blocks |

For an unplayed set, leave both set columns blank. Three to five consecutive sets must give exactly one team three set wins. Player counts must be nonnegative whole numbers, and `points` must equal `serve_aces + attack_points + block_points`.

## Calculations

- Final match score: count the sets won by each team.
- Attack success: `attack_points / attack_attempts × 100`.
- Attack efficiency: `(attack_points - attack_errors - attack_blocked) / attack_attempts × 100`.
- Reception error rate: `reception_errors / reception_attempts × 100`.
- Team totals: sum player counts; team rates use summed counts rather than average player percentages.

A rate with zero attempts is unavailable. Supplied CEV positive and excellent reception percentages are displayed as reported because rounded percentages cannot reliably reconstruct their underlying counts. Team **player points** can be lower than set points because opponent errors can award points without crediting a player.

## Concrete acceptance checks

The reference match gives results that can be checked by hand:

- **Player calculation:** Tijana Bošković has 33 attack points, 2 attack errors, 2 blocked attacks, and 63 attempts. Her efficiency is `(33 - 2 - 2) / 63 = 0.4603`, displayed as **46.0%**.
- **Live import:** match 82293 produces VakifBank Istanbul 3–2 Conegliano, all five set scores, and both 14-player rosters.
- **CSV team calculation:** the selected VakifBank players total `34 + 31 = 65` player points. Their combined efficiency is `(64 - 9 - 4) / 123 = 0.4146`, displayed as **41.5%**.

Automated tests check parsing, URL restrictions, changed markup, statistical validation, controlled retrieval, server behavior, and these known results.

## Scope

The first complete version imports one public CEV match URL or one fallback CSV and displays one match at a time. It does not perform live scoring, video analysis, player tracking, machine-learning prediction, accounts, sharing, bulk scraping, or professional-system replacement. Comparing matches and adding defensible position and level benchmarks remain possible later extensions.

The [planning log](PLANNING_LOG.md) records project decisions. The current [OpenSpec change](openspec/changes/archive/2026-09-28-add-cev-url-import/proposal.md) defines the importer work, while archived changes preserve the implemented baseline.
