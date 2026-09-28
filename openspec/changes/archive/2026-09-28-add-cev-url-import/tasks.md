## 1. Import contract and parser

- [x] 1.1 Add a compact CEV-shaped fixture for match 82293 and document which external fields map to the internal model; verify the fixture includes both teams, five sets, placeholders, and representative players.
- [x] 1.2 Implement strict CEV URL validation and canonicalization; verify tests reject alternate hosts, paths, credentials, fragments, duplicate IDs, and unsupported query values.
- [x] 1.3 Implement CEV HTML entity decoding and match/player parsing; verify fixture tests extract both teams, all sets, all represented players, Tijana Bošković's counts, and placeholder values.
- [x] 1.4 Pass parsed CEV data through shared statistical validation; verify malformed or structurally incomplete fixture variants fail with specific errors rather than partial output.

## 2. Controlled local server

- [x] 2.1 Add a loopback-only static server and `npm start` command; verify the application and sample file are served with appropriate content types and traversal paths are rejected.
- [x] 2.2 Add the same-origin CEV import endpoint with an exact URL allowlist, redirect rejection, timeout, request-body limit, and response-size limit; verify HTTP integration tests cover success and every failure boundary with an injected fetch implementation.

## 3. User workflow

- [x] 3.1 Make CEV URL import the primary loading control while keeping CSV as a fallback; verify successful URL and CSV imports use the same report renderer.
- [x] 3.2 Show loading state, source provenance, and actionable retrieval/format errors; verify a second valid source replaces the first and invalid input clears the previous report.
- [x] 3.3 Detect direct `file:` use and explain how to run `npm start`; verify the CSV fallback remains usable and the server requirement is clear.

## 4. Documentation and end-to-end verification

- [x] 4.1 Revise the README scope, setup, architecture, risk, and concrete acceptance examples so the CEV importer is central; verify the documented commands work from a fresh terminal.
- [x] 4.2 Run unit, HTTP integration, OpenSpec, and browser checks, plus one live import of CEV match 82293; verify the 3–2 result, five sets, both full rosters, and Tijana Bošković's 46.0% attack efficiency.
