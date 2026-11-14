# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Existing application: plain HTML, CSS and JavaScript with a local Node.js server, no third-party dependencies. The promo page must publish on GitHub Pages.

## Users

Volleyball fans and amateur players who want to understand match statistics. Confirmed by the user on 2026-11-14.

## Product Purpose

Turn a CEV match report or prepared CSV into final scores, set results, team totals and individual player statistics; save reports locally and compare a player across saved matches.

## Operating Context

The full application runs locally with Node.js 20 or newer. CSV loading also works offline. The promo page introduces the program and explains how to try it.

## Capabilities and Constraints

CEV URL retrieval needs the local server and internet access. Saved reports use browser localStorage and do not sync. Player comparison matches exact names. GitHub Pages serves static files and cannot run the Node.js importer.

## Brand Commitments

Name: Volleyball Statistics Tracker & Match Analyzer. Use plain language grounded in real match data. No personal information on the published promo page.

## Evidence on Hand

README.md contains the checked Marina Markova comparison for CEV matches 82223 and 82229. Full 28-player CSV files and source HTML reports are committed under samples/. No testimonials, adoption figures or predictive claims are established.

## Product Principles

- Explain statistics through a real match example.
- Make trying the program understandable to a first-time visitor.
- Describe existing capabilities accurately.
- Keep the public promo page free of personal information.
