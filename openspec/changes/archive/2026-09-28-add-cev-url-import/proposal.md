## Why

Manual conversion removes format uncertainty but also removes the project's main technical challenge. Directly importing a real CEV match page makes the tool useful immediately after a match and requires reliable retrieval, parsing, normalization, validation, and failure handling against an external page that can change.

## What Changes

- Add a CEV match URL field as the primary way to load a match.
- Retrieve only supported public CEV match-statistics pages through the local application server.
- Parse match teams, set scores, and every player row into the existing internal match model.
- Detect incomplete, unsupported, or changed CEV pages and show useful import errors rather than partial statistics.
- Keep the documented CSV import as an offline fallback and stable test format.
- Replace direct file opening with a local start command because remote retrieval requires a server boundary.

## Capabilities

### New Capabilities

- `cev-match-import`: Validate, retrieve, parse, and normalize a supported CEV match-statistics URL.

### Modified Capabilities

- `match-statistics-report`: Allow the currently displayed match to originate from a CEV URL while retaining the one-match-at-a-time behavior.

## Impact

The local static application becomes a small Node.js application with an HTTP server and a same-origin CEV import endpoint. The interface, tests, documentation, package scripts, and deployment instructions change. CSV import and the existing report calculations remain supported.
