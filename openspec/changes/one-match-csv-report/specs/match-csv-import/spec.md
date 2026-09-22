## Purpose

Defines the portable, manually prepared CSV that lets a user load one volleyball match and its player statistics without an online data source.

## ADDED Requirements

### Requirement: Single-match CSV layout
The system SHALL accept a UTF-8 CSV with one header row, exactly one `match` row, and one or more `player` rows. The header SHALL contain `row_type`, `team_1`, `team_2`, `set_1_team_1`, `set_1_team_2` through `set_5_team_1`, `set_5_team_2`, `team`, `player`, `points`, `serve_attempts`, `serve_errors`, `serve_aces`, `reception_attempts`, `reception_errors`, `reception_positive_pct`, `reception_excellent_pct`, `attack_attempts`, `attack_errors`, `attack_blocked`, `attack_points`, and `block_points`. Column order SHALL be flexible; unknown extra columns SHALL be ignored.

#### Scenario: Load a valid file
- **WHEN** a user loads a CSV with one `match` row and player rows using these columns
- **THEN** the system makes that match available for a report

#### Scenario: Missing required column
- **WHEN** a CSV omits a required column
- **THEN** the system identifies that column and does not produce a report

### Requirement: Match row
The `match` row SHALL contain distinct nonempty `team_1` and `team_2` names and point scores for three to five consecutive played sets. Each played set SHALL have two nonnegative integer scores and a winner; later unplayed sets SHALL have both scores blank. Exactly one team SHALL win three sets. Player-only columns SHALL be blank on the `match` row.

#### Scenario: Five-set match
- **WHEN** a match row contains five valid set scores with one team winning three sets
- **THEN** the system accepts all five sets and derives the final set score

#### Scenario: Incomplete set
- **WHEN** one set has a score for only one team
- **THEN** the system reports the invalid set and does not produce a report

#### Scenario: Invalid winner
- **WHEN** the played sets do not result in exactly one team winning three sets
- **THEN** the system reports the invalid match score and does not produce a report

### Requirement: Player rows
Each `player` row SHALL contain a `team` matching one of the match teams, a nonempty `player` name, and nonnegative integer values for `points`, `serve_attempts`, `serve_errors`, `serve_aces`, `reception_attempts`, `reception_errors`, `attack_attempts`, `attack_errors`, `attack_blocked`, `attack_points`, and `block_points`. Match-only columns SHALL be blank on player rows. The same team and player name combination SHALL appear at most once. A zero count SHALL be written as `0`, not as an empty cell.

#### Scenario: Player with no receptions
- **WHEN** a player row has `reception_attempts` and `reception_errors` equal to `0`
- **THEN** blank reception quality percentages are accepted

#### Scenario: Duplicate player
- **WHEN** two player rows use the same team and player name
- **THEN** the system reports the duplicate and does not produce a report

### Requirement: Reception quality percentages
For a player with at least one reception attempt, `reception_positive_pct` and `reception_excellent_pct` SHALL be numeric values from 0 to 100 inclusive. For a player with zero reception attempts, these fields SHALL be blank. The system SHALL preserve the supplied values as reported percentages rather than infer reception quality counts from rounded percentages.

#### Scenario: Rounded CEV percentages
- **WHEN** a player row supplies `reception_positive_pct` of `47` and `reception_excellent_pct` of `21`
- **THEN** the loaded data retains 47% and 21% for display

### Requirement: Statistical consistency
The system SHALL reject rows where errors, aces, or successful attacks exceed their respective attempt counts, where `attack_errors + attack_blocked + attack_points` exceeds `attack_attempts`, or where `points` differs from `serve_aces + attack_points + block_points`. It SHALL report the row and field responsible for each validation failure.

#### Scenario: Inconsistent points
- **WHEN** a player has 33 attack points, no serve aces, one block point, and `points` of 35
- **THEN** the system reports that the player points do not equal 34 and does not produce a report

### Requirement: Failed import leaves no misleading report
The system SHALL show useful row and column errors for malformed CSV or invalid data and SHALL not show an invalid match as a valid report.

#### Scenario: Invalid file after a valid file
- **WHEN** a user loads an invalid CSV after viewing a valid match
- **THEN** the system shows import errors and does not present the invalid data as a new report
