## MODIFIED Requirements

### Requirement: One match at a time
The report SHALL show only the currently loaded match, whether it came from a supported CEV match URL or a valid CSV. Loading another valid source SHALL replace the displayed match. An invalid source SHALL clear the previous report before showing errors. The system SHALL not compare or average a player's data across matches.

#### Scenario: Load another match
- **WHEN** a user loads a second valid CEV URL or CSV
- **THEN** the report shows only the second match

#### Scenario: CSV fallback
- **WHEN** a user cannot retrieve a CEV page but has a valid CSV in the documented format
- **THEN** the user can load the CSV and view the same match report
