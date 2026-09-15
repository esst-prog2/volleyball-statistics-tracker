# Volleyball Statistics Tracker & Match Analyzer

## 1. The demo

I open the application and load `match_001.csv`. The match screen shows the final score and the main statistics for both teams, including attack, serve, reception, blocks, points and errors. I select a player and see their individual statistics, including attack efficiency, reception and points. I then select another match and compare the player's performance across the two matches. I can also load a new CSV file and generate the same type of summary.

## 2. The shape

```text
in     a CSV file containing match statistics: match, team, player,
       position and statistics for serves, receptions, attacks and blocks

out    a match summary, player statistics, team statistics and
       comparisons between matches

in between   validate and clean the data; calculate statistics such as
             attack efficiency and reception percentage; group the data
             by match, team and player; display the results in tables

```

The project will use fixed formulas for the calculated statistics, documented in the code and README.

## 3. The size

**First useful version**

* import a CSV file with volleyball match statistics
* check that required columns and values are present
* calculate attack efficiency, reception percentage, points, blocks and errors
* show a summary of one match for both teams
* show the statistics of an individual player
* compare a player's statistics across several matches

**Not this term**

* live statistics during a match
* automatic statistics from match videos
* player tracking from video
* a mobile application
* user accounts and online sharing
* predicting match results or player performance with machine learning
* replacing professional systems such as Data Volley

A CEV importer are optional and will only be added if the main version is working.

## 4. How we would know it works

* Given a valid CSV file with one match, the program produces the correct team and player statistics for that match.
* Given a CSV file with a required column missing, the program reports the missing column instead of producing an incorrect report.
* Given a player with statistics from several matches, the program calculates the correct results for each match and the player's average.

## 5. What could stop this

* The main risk is the format of the volleyball statistics. Different sources may use different names or formats for the same information. I will therefore create one CSV format for my project and convert the data to that format before analysing it.

* Another risk is getting enough match data. I can use public match reports as examples and create small sample datasets for testing. I will not use personal or private data.

* The project could also become too large because professional volleyball statistics contain much more information than I need. I will start with serves, receptions, attacks, blocks, points and errors and add more statistics only if the basic version is working.

* A technical risk is the possible CEV importer. The website structure could change or the data might not be easy to extract automatically. For this reason, importing CEV reports is optional and the main application will work with CSV files without an internet connection.

* The main goal is to make something I could actually use after a volleyball match: give it the match statistics and get a clear overview of how the team and individual players performed.



