# Planning log

Use this file to record the plan, decisions, progress, and open items for work in this repository. Add dated entries as work proceeds.

## 2026-09-22 — Start planning log

- **Goal:** Keep a planning log for subsequent work.
- **Plan:** Record each task's intended outcome, key decisions, completed steps, and remaining work here.
- **Progress:** Created this log.
- **Open items:** Awaiting the next task.
2026-09-22 | Decision: Append one dated line for every project decision about a requirement, number, name, or tool; identify whether the user or assistant decided it; never rewrite earlier lines. | Decided by: user
2026-09-22 | Decision: Use OpenSpec version 1.13.0 and initialize it in this repository. | Decided by: user
2026-09-22 | Decision: Install Node.js 24.21.0 LTS because Node was missing. | Decided by: assistant
2026-09-22 | Decision: Configure OpenSpec for Codex during initialization. | Decided by: assistant
2026-09-22 | Decision: Leave openspec/config.yaml as initialized. | Decided by: user
2026-09-22 | Decision: Use openspec/specs/ for the current truth of what the program does. | Decided by: user
2026-09-22 | Decision: Use openspec/changes/ for work in progress. | Decided by: user
2026-09-22 | Decision: The usual CSV format has one row representing one player's statistics for one match. | Decided by: user
2026-09-22 | Decision: The CSV loaded by the application should use a format similar to a CEV match report. | Decided by: user
2026-09-22 | Decision: Use CEV match statistics page ID 82293 as the reference example for the desired input data. | Decided by: user
2026-09-22 | Decision: Keep direct CEV page importing out of the first version; manually convert CEV match reports to CSV and load those files instead. | Decided by: user
2026-09-22 | Decision: Prioritize a minimum viable product for the current phase. | Decided by: user
2026-09-22 | Decision: The MVP handles one match at a time; comparisons across matches are outside MVP scope. | Decided by: user
2026-09-22 | Decision: Do not repeat the match score on every player row in the MVP CSV. | Decided by: user
2026-09-22 | Decision: Use one MVP CSV with a row_type column, one match row containing the teams and score, and one row per player containing player statistics. | Decided by: user
2026-09-22 | Decision: Include each set's point score in the MVP CSV match row. | Decided by: user
2026-09-22 | Decision: Limit MVP player statistics to the README's core categories: points, serves, receptions, attacks, blocks, and errors. | Decided by: user
2026-09-22 | Decision: In the MVP CSV, the match row contains both team names and each set's points; player rows contain team, player, points, serve attempts/errors/aces, reception attempts/errors, attack attempts/errors/points, and block points. | Decided by: user
2026-09-22 | Decision: Derive the final set score and rates from counts where possible; copy CEV reception quality percentages into the CSV and display them as supplied. | Decided by: user
2026-09-22 | Decision: Name the OpenSpec change one-match-csv-report, with capabilities match-csv-import and match-statistics-report. | Decided by: assistant
2026-09-22 | Decision: Plan the MVP as a local static browser app using HTML, CSS, and JavaScript. | Decided by: assistant
2026-09-22 | Decision: Use the exact CSV field names and validation rules specified in the one-match-csv-report OpenSpec change. | Decided by: assistant
2026-09-22 | Decision: Calculate attack success as attack points divided by attempts, attack efficiency as (attack points minus attack errors minus attacks blocked) divided by attempts, and reception error rate from errors divided by attempts. | Decided by: assistant
2026-09-22 | Decision: Apply the approved OpenSpec MVP change, then commit and push the completed work. | Decided by: user
2026-09-28 | Decision: Use the real CEV sample to state and test concrete expected results: Tijana Bošković's attack efficiency is 46.0%, selected VakifBank player points total 65, and their combined attack efficiency is 41.5%. | Decided by: user
2026-09-28 | Decision: Make direct CEV match URL importing the project's central technical challenge and keep CSV loading as a fallback and test format. | Decided by: user
2026-09-28 | Decision: Name the OpenSpec change add-cev-url-import and implement it with Node.js built-in HTTP and fetch APIs on 127.0.0.1, default port 3000, with no new runtime dependency. | Decided by: assistant
2026-09-28 | Decision: Restrict CEV retrieval to the exact HTTPS match-statistics host and path, reject redirects, and use a 10-second timeout, 2 MiB response limit, and 8 KiB request limit. | Decided by: assistant
