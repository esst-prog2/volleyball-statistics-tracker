# Volleyball Statistics Tracker & Match Analyzer

## 1. The demo

My five-minute presentation uses screenshots of the Volleyball Statistics Tracker to compare two CEV matches between Savino Del Bene SCANDICCI and VakifBank ISTANBUL. I import match 82223 from 8 January 2026 and match 82229 from 4 February 2026; `samples/cev-82223-full-match.csv` and `samples/cev-82229-full-match.csv` provide offline copies with 28 players each. The **Final score** screenshots show VakifBank winning 3–1 and 3–2, and **Team statistics** shows each team’s totals. In **Players**, I select MARKOVA Marina, who scores 21 points in the first match and 32 in the second. I reopen the reports through **Saved matches** and select her in **Compare a player across matches**, where attack success is 43.2% and 55.6%, attack efficiency is 22.7% and 35.2%, and reception error rate is 11.4% and 2.6%, respectively. The final presentation screenshot shows both comparison rows together, with save times identified separately from the match dates.

## Run the application

Node.js 20 or newer, with npm, is required. There are no third-party dependencies to install, so `npm install` is not needed. From the repository terminal, run:

```bash
npm start
```

Open the address printed in the terminal, normally <http://127.0.0.1:3000>. Paste a URL such as:

```text
https://www-old.cev.eu/Competition-Area/MatchStatistics.aspx?ID=82293
```

The application makes one request for that public report, parses both teams, and shows the result. Stop the server with **Control+C**. Opening `index.html` directly still permits CSV loading, but CEV importing requires `npm start` because the browser cannot reliably retrieve another site's page itself.

Run the automated test suite with:

```bash
npm test
```

Tests use committed CSV/HTML inputs and mocked CEV responses; they do not contact live websites or require internet access. HTTP tests start a temporary server on `127.0.0.1`, so the environment must permit local port access. Live CEV importing in the application requires internet access; CSV fallback works offline.

## Saved matches and player comparison

Successful CSV and CEV imports are automatically saved in this browser. Use **Saved matches** to reopen a report without fetching CEV again, or delete a saved copy. Reimporting a CEV URL replaces its saved report; identical CSV match data also replaces its saved copy, regardless of filename.

Choose a player under **Compare a player across matches** to see attack success, attack efficiency, and reception error rate for their saved appearances. Matching uses the exact player name; check the team for namesakes. Rows show save times, newest first, rather than match dates. Zero-attempt rates appear as **Unavailable**. Reception error rate also appears in the team and individual report sections.

Saved data stays in browser storage for this address and browser profile. Clearing browser data removes it; it does not sync between devices. If storage is blocked or full, the current report still works and a status message explains that saving failed. Use a stable server address and port to access the same saved library.

Import errors give guidance for correcting URLs or using the CSV fallback when CEV changes its report format. Temporary retrieval failures offer **Retry import**. Unexpected server errors are logged on the server while the browser receives a generic error.

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

`samples/cev-82294-full-match.csv` is a second real conversion based on [CEV match 82294](https://www-old.cev.eu/Competition-Area/MatchStatistics.aspx?ID=82294). It contains Eczacibasi Istanbul versus Scandicci, all five sets, and all 28 listed players. This second conversion confirms that the same CSV layout handles different teams, names with accented characters, players with zero attempts, reception percentages, and another complete five-set report without adding columns or changing validation rules.

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
- **Second real conversion:** match 82294 loads as Eczacibasi Istanbul 3–2 Scandicci with five sets and 28 players; Ekaterina Antropova has 34 points and 28 successful attacks from 49 attempts.

Automated tests check parsing, URL restrictions, changed markup, statistical validation, controlled retrieval, server behavior, and these known results.

### CEV TOTAL-row verification

A focused check against match 82294 compared every team TOTAL-row cell that has an equivalent in the application. **22 of 24 cells matched exactly**, including every count. The two differences were attack-success percentages: the application displays `73 / 139` as **52.5%** while CEV prints **53%**, and `58 / 125` as **46.4%** while CEV prints **46%**. The largest discrepancy was therefore **0.5 percentage points**, caused by CEV using whole percentages while the application keeps one decimal place. The application retains one decimal place because it shows the count-derived value more precisely.

The check also confirmed that CEV explicitly reports DIKEN Meliha's four receptions as 0% positive and 0% excellent. Her reception-error cell is `.`, which is the only value normalized to zero. The committed [raw input and source record](spikes/cev-82294-team-totals/SOURCE.md), [parsed TOTAL rows](spikes/cev-82294-team-totals/parsed-total-rows.json), and [cell-by-cell diff](spikes/cev-82294-team-totals/diff-output.txt) make the result reproducible without relying on the live page.

## Scope

The first complete version imports one public CEV match URL or one fallback CSV and displays one match at a time. It does not perform live scoring, video analysis, player tracking, machine-learning prediction, accounts, sharing, bulk scraping, or professional-system replacement. Comparing matches and adding defensible position and level benchmarks remain possible later extensions.

The [planning log](PLANNING_LOG.md) records project decisions. The current [OpenSpec change](openspec/changes/archive/2026-09-28-add-cev-url-import/proposal.md) defines the importer work, while archived changes preserve the implemented baseline.
