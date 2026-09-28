# match-statistics-report Specification

## Purpose

Defines the one-match report that summarizes set scores and core volleyball statistics for both teams and their individual players.

## Requirements

### Requirement: Match result and sets
The system SHALL show both team names, the final score in sets, and each played set's points from the loaded match. The final set score SHALL equal the number of sets won by each team.

#### Scenario: Five-set result
- **WHEN** the loaded set scores give team 1 three set wins and team 2 two set wins
- **THEN** the report shows a 3–2 result and all five set point scores

### Requirement: Team core statistics
The system SHALL show for each team the sum of player points, serve attempts/errors/aces, reception attempts/errors, attack attempts/errors/blocked/points, and block points. It SHALL label the sum of player points as player points rather than imply it equals the team's set point totals, which can include opponent errors.

#### Scenario: Team totals
- **WHEN** the sample CSV contains VakifBank players with 34 and 31 points and combined attack counts of 64 points, 9 errors, 4 blocked attacks, and 123 attempts
- **THEN** the team summary shows 65 player points and 41.5% combined attack efficiency

### Requirement: Player core statistics
The system SHALL list players by team and allow a user to select a player to see that player's points, serve attempts/errors/aces, reception attempts/errors and supplied quality percentages, attack attempts/errors/blocked/points, and block points.

#### Scenario: Select a player
- **WHEN** a user selects a player from the loaded match
- **THEN** the report shows the values from that player's row

### Requirement: Calculated rates
The system SHALL calculate attack success percentage as `attack_points / attack_attempts * 100` and attack efficiency percentage as `(attack_points - attack_errors - attack_blocked) / attack_attempts * 100`. It SHALL calculate reception error percentage as `reception_errors / reception_attempts * 100`. It SHALL calculate team rates from summed counts, not by averaging player percentages. It SHALL not calculate a team reception positive or excellent percentage from rounded player percentages. A rate with zero attempts SHALL display as unavailable.

#### Scenario: Attack rates from counts
- **WHEN** a player has 63 attack attempts, 33 attack points, 2 attack errors, and 2 attacks blocked
- **THEN** the report shows approximately 52.4% attack success and 46.0% attack efficiency

#### Scenario: No attempts
- **WHEN** a player has zero reception attempts
- **THEN** the report shows reception error percentage as unavailable and does not divide by zero

### Requirement: One match at a time
The report SHALL show only the currently loaded match, whether it came from a supported CEV match URL or a valid CSV. Loading another valid source SHALL replace the displayed match. An invalid source SHALL clear the previous report before showing errors. The system SHALL not compare or average a player's data across matches.

#### Scenario: Load another match
- **WHEN** a user loads a second valid CEV URL or CSV
- **THEN** the report shows only the second match

#### Scenario: CSV fallback
- **WHEN** a user cannot retrieve a CEV page but has a valid CSV in the documented format
- **THEN** the user can load the CSV and view the same match report
