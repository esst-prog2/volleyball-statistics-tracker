"use strict";

const fs = require("node:fs");
const path = require("node:path");
const core = require("../../src/core.js");

const htmlPath = process.argv[2] || path.join(__dirname, "input/cev-82294.html");

const html = fs.readFileSync(htmlPath, "utf8");
const csv = fs.readFileSync(path.join(__dirname, "../../samples/cev-82294-full-match.csv"), "utf8");
const parsed = core.parseMatchCsv(csv);
if (parsed.errors.length) throw new Error(JSON.stringify(parsed.errors));

function text(value) {
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

const labels = [
  "points", "break_points", "win_loss", "serve_attempts", "serve_errors", "serve_aces",
  "reception_attempts", "reception_errors", "reception_positive_pct", "reception_excellent_pct",
  "attack_attempts", "attack_errors", "attack_blocked", "attack_points", "attack_success_pct", "block_points",
];

function totalRow(tableId) {
  const table = new RegExp(`<table\\b[^>]*id=["']${tableId}["'][^>]*>([\\s\\S]*?)<\\/table>`, "i").exec(html)?.[1];
  if (!table) throw new Error(`Missing ${tableId}`);
  const row = [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map((match) => match[1]).find((value) => /Team Totals/i.test(value));
  if (!row) throw new Error(`Missing Team Totals in ${tableId}`);
  const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => text(match[1]));
  if (cells.length !== 24) throw new Error(`Expected 24 cells in ${tableId} TOTAL row, found ${cells.length}`);
  return Object.fromEntries(labels.map((label, index) => [label, Number.parseFloat(cells[index + 8])]));
}

const cevRows = {
  [parsed.match.team1]: totalRow("GV_elenco_casa"),
  [parsed.match.team2]: totalRow("GV_elenco_fuori"),
};

const comparable = [
  "points", "serve_attempts", "serve_errors", "serve_aces", "reception_attempts", "reception_errors",
  "attack_attempts", "attack_errors", "attack_blocked", "attack_points", "attack_success_pct", "block_points",
];
const excluded = ["break_points", "win_loss", "reception_positive_pct", "reception_excellent_pct"];
const rows = [];

for (const team of [parsed.match.team1, parsed.match.team2]) {
  const totals = core.teamTotals(parsed.match, team);
  const computed = { ...totals, attack_success_pct: Number(core.attackSuccess(totals).toFixed(1)) };
  for (const field of comparable) {
    const difference = Number((computed[field] - cevRows[team][field]).toFixed(6));
    rows.push({ team, field, computed: computed[field], cev: cevRows[team][field], difference, matches: difference === 0 });
  }
}

const matching = rows.filter((row) => row.matches).length;
const largest = rows.reduce((current, row) => Math.abs(row.difference) > Math.abs(current.difference) ? row : current, rows[0]);
const diken = parsed.match.players.find((player) => player.name === "DIKEN Meliha");

fs.writeFileSync(path.join(__dirname, "parsed-total-rows.json"), `${JSON.stringify(cevRows, null, 2)}\n`);

const lines = [
  "CEV match 82294 TOTAL-row comparison",
  "======================================",
  "",
  `Result: ${matching} of ${rows.length} comparable cells match exactly.`,
  `Largest discrepancy: ${largest.team} ${largest.field}; computed ${largest.computed}, CEV ${largest.cev}, absolute difference ${Math.abs(largest.difference)} percentage points.`,
  "",
  "Comparison uses the application's one-decimal display value for attack success and CEV's printed integer percentage.",
  `Excluded from N because the application does not compute them: ${excluded.join(", ")} (${excluded.length} per team, ${excluded.length * 2} cells total).`,
  "Application-only rates excluded because CEV does not print them in this row: attack efficiency, reception error rate.",
  "",
  "team | field | computed | CEV | difference | result",
  "--- | --- | ---: | ---: | ---: | ---",
  ...rows.map((row) => `${row.team} | ${row.field} | ${row.computed} | ${row.cev} | ${row.difference} | ${row.matches ? "MATCH" : "DIFF"}`),
  "",
  "DIKEN Meliha check",
  "------------------",
  `CSV/imported values: ${diken.reception_attempts} receptions, ${diken.reception_errors} errors, ${diken.reception_positive_pct}% positive, ${diken.reception_excellent_pct}% excellent.`,
  "The CEV player row explicitly prints 4, '.', 0%, 0% respectively. The parser converts only the '.' error placeholder to count 0; both reception percentages are explicit CEV zeroes.",
  "",
];
fs.writeFileSync(path.join(__dirname, "diff-output.txt"), lines.join("\n"));
process.stdout.write(lines.join("\n"));
