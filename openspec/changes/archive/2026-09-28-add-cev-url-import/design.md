## Context

The current application is static HTML, CSS, and JavaScript opened from disk. It already has a validated internal match shape, CSV fallback, calculations, and report UI. Browsers cannot reliably fetch the CEV page directly because cross-origin policy is controlled by CEV, so the importer needs a local server boundary. The reference page uses stable ASP.NET element IDs and two fixed-layout player tables, but that external markup can change.

## Goals / Non-Goals

**Goals:**

- Make a pasted CEV URL the primary path from a real public match report to the existing report.
- Detect markup drift and fail visibly instead of returning plausible partial data.
- Restrict remote retrieval tightly enough that the endpoint cannot become a general web proxy.
- Keep setup small and reproducible with the installed Node.js runtime.

**Non-Goals:**

- Supporting every volleyball statistics site, authenticated CEV tools, live scoring, set-specific CEV pages, or historical bulk downloads.
- Matching CEV's visual design or reproducing statistics outside the project's core fields.

## Decisions

### Built-in Node.js server

Add a server using Node's built-in HTTP and fetch APIs, bind it to `127.0.0.1`, serve the existing files, and expose `POST /api/cev-import`. This avoids a production dependency while solving browser cross-origin restrictions. Opening `index.html` directly will show guidance to use `npm start`; CSV parsing and report logic remain browser-side.

### Exact URL allowlist and bounded fetch

Parse the submitted value as a URL and reconstruct its canonical form only after checking HTTPS, exact hostname, exact path, a single positive numeric `ID`, and optional `setN=0`. Fetch with redirects disabled, a timeout, and a response-size limit. Alternatives such as a user-controlled proxy URL or following redirects would create unnecessary server-side request risk.

### Parser at the server boundary

Parse the downloaded HTML on the server into the same match object used by CSV import. Locate scalar values by CEV element ID (`L_HomeTeam`, `L_GuestTeam`, `L_Set1` through `L_Set5`) and player tables by `GV_elenco_casa` and `GV_elenco_fuori`. Interpret player rows only when they contain the expected name identifier and exactly the known statistic columns. HTML entities and CEV placeholders are normalized before the existing validation rules run.

Using the stable identifiers is clearer and more testable than scraping visible text positions across the whole page. The parser still treats the page as an external contract and returns a specific format-change error when required structure is absent.

### Shared validation

Extract match validation from the CSV-specific flow so imported CEV objects and parsed CSV rows pass through the same consistency checks. Preserve source metadata separately from statistical fields. The browser renders either valid result through one report path.

### Deterministic tests plus live verification

Keep a compact CEV-shaped HTML fixture containing the reference match's required structure and representative player rows. Unit and HTTP integration tests use the fixture without a network dependency. During implementation, separately run one live import against match 82293 to prove the current CEV page still matches the parser.

## Risks / Trade-offs

- **CEV markup changes** → Require all structural markers, produce a specific error, and keep CSV fallback documented.
- **CEV outage or slow response** → Enforce a timeout and preserve the local CSV path.
- **Server-side request abuse** → Use an exact HTTPS host/path/query allowlist, disable redirects, limit response bytes, and bind locally.
- **CEV may restrict automated retrieval later** → Identify the source, make one request per user action, and provide no bulk or background import.
- **Local server adds a start step** → Provide `npm start`, print the exact local address, and make the UI explain the requirement when opened directly.

## Migration Plan

Users run `npm start` and open the printed local address instead of opening `index.html` directly. Existing CSV files and calculations remain compatible. Removing the server restores the previous CSV-only application if the remote integration becomes unusable.
