# cev-match-import Specification

## Purpose

Lets a user turn a public CEV match-statistics page into the project's validated match model without manually copying the report into CSV.

## Requirements

### Requirement: Supported CEV URL
The system SHALL accept only an HTTPS URL on `www-old.cev.eu` whose path is `/Competition-Area/MatchStatistics.aspx` and whose `ID` query parameter is a positive integer. It SHALL reject credentials, fragments, alternate hosts, alternate paths, duplicate `ID` values, and unexpected query parameters except `setN=0`.

#### Scenario: Canonical match URL
- **WHEN** a user submits `https://www-old.cev.eu/Competition-Area/MatchStatistics.aspx?ID=82293`
- **THEN** the system accepts the URL for retrieval

#### Scenario: Unsupported URL
- **WHEN** a user submits a URL to another host or CEV path
- **THEN** the system explains that only a CEV match-statistics URL is supported and makes no remote request

### Requirement: Controlled retrieval
The system SHALL retrieve a supported page through the local server with a finite timeout and response-size limit. It SHALL not follow redirects to another URL and SHALL not expose arbitrary proxy access.

#### Scenario: CEV is unavailable
- **WHEN** the supported page times out or returns an unsuccessful response
- **THEN** the system shows an import error and preserves no partial imported match

#### Scenario: Oversized response
- **WHEN** the response exceeds the configured limit
- **THEN** retrieval stops and the system reports that the page is too large

### Requirement: CEV match parsing
The system SHALL parse both team names, three to five final set point pairs, and every player row from both CEV team tables. For each player it SHALL normalize CEV placeholder values to zero or unavailable as appropriate and extract points, serve attempts/errors/aces, reception attempts/errors/positive percentage/excellent percentage, attack attempts/errors/blocked/points, and block points.

#### Scenario: Reference match
- **WHEN** CEV match 82293 is imported
- **THEN** the result contains VakifBank Istanbul versus Conegliano, a 3–2 set result, five set scores, and Tijana Bošković with 34 points and 46.0% calculated attack efficiency

#### Scenario: Player without attempts
- **WHEN** a CEV player row uses `-` or `.` for statistics the player did not attempt
- **THEN** applicable counts are normalized to zero and rates with no attempts remain unavailable

### Requirement: Structural validation
The system SHALL require recognizable CEV identifiers for the teams, set scores, and both player tables. It SHALL pass normalized data through the same statistical validation used by CSV imports and SHALL reject a page rather than silently omit malformed required data or player rows.

#### Scenario: CEV markup changed
- **WHEN** a downloaded page lacks an expected team table or contains a player row that cannot be interpreted
- **THEN** the system reports that the CEV page format is unsupported or has changed and does not show a report

### Requirement: Import provenance
The report SHALL identify that its data came from CEV and SHALL retain the canonical source URL for the user to open.

#### Scenario: Successful CEV import
- **WHEN** a CEV page is successfully imported
- **THEN** the report shows a link to that CEV match page
