# Promo page content

Audience: volleyball fans and amateur players.
Approved approach: match story, selected by the user on 2026-11-14.

## Opening

**See more than the final score.**

Volleyball Statistics Tracker & Match Analyzer helps you explore match reports, understand a player's performance, and compare their saved matches.

For volleyball fans who want to look beyond the result, and amateur players learning what the numbers mean.

Primary link: **Try it locally** → the how-to section.
Secondary link: **View on GitHub** → https://github.com/esst-prog2/volleyball-statistics-tracker

## One player. Two matches. A different story.

Marina Markova plays for VakifBank Istanbul against Scandicci twice. VakifBank wins both matches, but her numbers tell you more.

| Match date | Points | Attack success | Attack efficiency | Reception error rate |
| --- | --- | --- | --- | --- |
| 8 January 2026 | 21 | 43.2% | 22.7% | 11.4% |
| 4 February 2026 | 32 | 55.6% | 35.2% | 2.6% |

Source: CEV matches 82223 and 82229; full-match CSV copies are included in the repository. These two performances illustrate a comparison, not a prediction or a claim about long-term improvement.

Attack success is the share of attack attempts that score a point. Attack efficiency also accounts for errors and blocked attacks. Reception error rate is the share of receptions recorded as errors; lower means fewer errors per reception.

## Follow the match, then follow the player

Import a supported CEV match-report URL or load a prepared CSV. See the final score, set scores, and team totals. Select a player to explore their statistics. Successful imports are saved in your browser, so you can reopen reports and compare the same player across matches.

No account is needed. Saved reports stay in this browser profile; clearing browser data removes them.

## Try it locally

You need Node.js 20 or newer and a modern browser.

1. Download the repository ZIP from GitHub and extract it, or clone the repository.
2. Open a terminal in the project folder and run `npm start`. No dependency installation is needed.
3. Open `http://127.0.0.1:3000` in your browser.
4. Load `samples/cev-82223-full-match.csv` and `samples/cev-82229-full-match.csv`, then choose **MARKOVA Marina** in **Compare a player across matches**.

You can also paste a supported CEV report URL while the local server is running. CEV importing needs internet access; the included CSV samples work offline.

GitHub Pages hosts this introduction. Full CEV URL importing runs through the local Node.js server.

Links: **Download the project** → https://github.com/esst-prog2/volleyball-statistics-tracker/archive/refs/heads/main.zip

**Read the setup guide** → https://github.com/esst-prog2/volleyball-statistics-tracker#run-the-application

## Closing

Pick a match. Find your player. Understand the numbers.

**Try it locally**

Independent student project. Not affiliated with CEV or the teams shown.

## Content rationale

The match story is the primary proof, ahead of the feature explanation. It reuses checked values in the repository demo. The alternative, a feature-first introduction, is simpler but gives a new visitor less reason to care about the statistics. No landscape search or independent second opinion was performed. Visual direction is deferred to Impeccable shape and generate, as required by the assignment.
