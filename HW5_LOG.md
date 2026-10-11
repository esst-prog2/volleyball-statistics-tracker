# Homework 5 — Make It Usable

## My test

**A test would go red if** my volleyball statistics tracker failed to read Gabi's attack points correctly from a real CEV match report.

I used CEV match 82295 and checked the official report manually before writing my test.

Expected values:
- Player: BRAGA GUIMARAES Gabriela (Gabi)
- Attack points: 14
- Attack attempts: 26
- Total points: 17

I added the test to `tests/cev.test.js` using the saved match report `samples/cev_match_82295.html`.

## RED — Breaking the program

In `src/cev.js`, I temporarily changed the attack-points column from `cells[21]` to `cells[22]`.

I ran `node --test tests/cev.test.js`.

Result: 3 tests passed and 3 failed, including my new Gabi test. The parser could no longer read her attack points correctly.

## GREEN — Fixing the program

I restored `cells[21]` and ran `npm test`.

Result: 21 tests passed, 0 failed.

## Real use

## Real use

I used my Volleyball Statistics Tracker with the actual CEV match report 82295, featuring Conegliano against Scandicci.

Before checking the results, I expected Gabi (BRAGA GUIMARAES Gabriela) to have:
- 14 attack points
- 26 attack attempts
- 17 total points

After opening the match in my application and selecting Gabi, I got:
- 14 attack points
- 26 attack attempts
- 17 total points

All three values matched the official match report.

The application also displayed her serving, reception, attack, and blocking statistics correctly in the player details section. This was useful because I could check the player's performance without reading the original CEV statistics table.

**Expected before running:**
- Gabi's attack points: 14
- Gabi's attack attempts: 26
- Gabi's total points: 17

**Actual after running:**
- To be recorded after the real-use run.

## What I learned

The test helped me check a real statistic against the official match report. Changing one column in the parser was enough to break the import, and the tests detected the problem.