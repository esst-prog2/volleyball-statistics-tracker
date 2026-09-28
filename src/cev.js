"use strict";

const core = require("./core.js");

const CEV_HOST = "www-old.cev.eu";
const CEV_PATH = "/Competition-Area/MatchStatistics.aspx";

class CevImportError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "CevImportError";
    this.code = code;
  }
}

function validateCevUrl(value) {
  let url;
  try {
    url = new URL(String(value).trim());
  } catch {
    throw new CevImportError("invalid_url", "Enter a complete CEV match-statistics URL.");
  }
  if (url.protocol !== "https:" || url.hostname !== CEV_HOST || url.port || url.username || url.password) {
    throw new CevImportError("unsupported_url", `Only HTTPS pages on ${CEV_HOST} are supported.`);
  }
  if (url.pathname !== CEV_PATH || url.hash) {
    throw new CevImportError("unsupported_url", "Use a CEV Competition-Area MatchStatistics.aspx URL without a fragment.");
  }
  const ids = url.searchParams.getAll("ID");
  const setValues = url.searchParams.getAll("setN");
  const keys = [...url.searchParams.keys()];
  if (ids.length !== 1 || !/^[1-9]\d*$/.test(ids[0])) {
    throw new CevImportError("unsupported_url", "The CEV URL must contain one positive numeric ID.");
  }
  if (keys.some((key) => key !== "ID" && key !== "setN") || setValues.length > 1 || (setValues.length === 1 && setValues[0] !== "0")) {
    throw new CevImportError("unsupported_url", "Only the full-match page is supported; remove extra query parameters.");
  }
  return `https://${CEV_HOST}${CEV_PATH}?ID=${ids[0]}`;
}

function decodeEntities(value) {
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, entity) => {
    if (entity[0] === "#") {
      const hex = entity[1].toLowerCase() === "x";
      const number = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(number) ? String.fromCodePoint(number) : whole;
    }
    return named[entity.toLowerCase()] ?? whole;
  });
}

function textContent(value) {
  return decodeEntities(value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ").trim();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function elementTextById(html, id, required = true) {
  const pattern = new RegExp(`<([a-z][a-z0-9]*)\\b[^>]*\\bid=["']${escapeRegex(id)}["'][^>]*>([\\s\\S]*?)<\\/\\1>`, "i");
  const match = pattern.exec(html);
  if (!match) {
    if (!required) return "";
    throw new CevImportError("format_changed", `The CEV page is missing ${id}; its format may have changed.`);
  }
  return textContent(match[2]);
}

function tableHtmlById(html, id) {
  const pattern = new RegExp(`<table\\b[^>]*\\bid=["']${escapeRegex(id)}["'][^>]*>([\\s\\S]*?)<\\/table>`, "i");
  const match = pattern.exec(html);
  if (!match) throw new CevImportError("format_changed", `The CEV page is missing ${id}; its format may have changed.`);
  return match[1];
}

function countValue(value, field, player) {
  const normalized = value.trim();
  if (normalized === "" || normalized === "." || normalized === "-") return 0;
  if (!/^(0|[1-9]\d*)$/.test(normalized)) {
    throw new CevImportError("format_changed", `Could not read ${field} for ${player}; the CEV page format may have changed.`);
  }
  return Number(normalized);
}

function percentValue(value, attempts, field, player) {
  const normalized = value.trim();
  if (attempts === 0 && (normalized === "" || normalized === "." || normalized === "-")) return null;
  const match = /^(\d+(?:\.\d+)?)%$/.exec(normalized);
  if (!match || Number(match[1]) > 100) {
    throw new CevImportError("format_changed", `Could not read ${field} for ${player}; the CEV page format may have changed.`);
  }
  return Number(match[1]);
}

function parsePlayerTable(html, tableId, team, side) {
  const table = tableHtmlById(html, tableId);
  const rows = [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
  const players = [];
  const namePattern = new RegExp(`${side}_L_Nome_(\\d+)`, "i");
  for (const rowMatch of rows) {
    const nameId = namePattern.exec(rowMatch[1]);
    if (!nameId) continue;
    const cells = [...rowMatch[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => textContent(match[1]));
    if (cells.length !== 24) {
      throw new CevImportError("format_changed", `Could not read a player row for ${team}; expected 24 statistics columns.`);
    }
    const player = elementTextById(rowMatch[1], `${side}_L_Nome_${nameId[1]}`);
    if (!player) throw new CevImportError("format_changed", `A player name is missing in the ${team} table.`);
    const receptionAttempts = countValue(cells[14], "reception attempts", player);
    players.push({
      team,
      name: player,
      points: countValue(cells[8], "points", player),
      serve_attempts: countValue(cells[11], "serve attempts", player),
      serve_errors: countValue(cells[12], "serve errors", player),
      serve_aces: countValue(cells[13], "serve aces", player),
      reception_attempts: receptionAttempts,
      reception_errors: countValue(cells[15], "reception errors", player),
      reception_positive_pct: percentValue(cells[16], receptionAttempts, "positive reception percentage", player),
      reception_excellent_pct: percentValue(cells[17], receptionAttempts, "excellent reception percentage", player),
      attack_attempts: countValue(cells[18], "attack attempts", player),
      attack_errors: countValue(cells[19], "attack errors", player),
      attack_blocked: countValue(cells[20], "blocked attacks", player),
      attack_points: countValue(cells[21], "attack points", player),
      block_points: countValue(cells[23], "block points", player),
    });
  }
  if (!players.length) throw new CevImportError("format_changed", `No player rows were found for ${team}; the CEV page format may have changed.`);
  return players;
}

function csvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function validateThroughCsv(match) {
  const header = core.REQUIRED_COLUMNS;
  const matchRow = Object.fromEntries(header.map((field) => [field, ""]));
  Object.assign(matchRow, { row_type: "match", team_1: match.team1, team_2: match.team2 });
  for (const set of match.sets) {
    matchRow[`set_${set.number}_team_1`] = set.team1;
    matchRow[`set_${set.number}_team_2`] = set.team2;
  }
  const rows = [matchRow, ...match.players.map((player) => {
    const row = Object.fromEntries(header.map((field) => [field, ""]));
    Object.assign(row, player, { row_type: "player", player: player.name });
    return row;
  })];
  const csv = [header, ...rows.map((row) => header.map((field) => row[field]))]
    .map((row) => row.map(csvCell).join(",")).join("\n");
  const result = core.parseMatchCsv(csv);
  if (result.errors.length) {
    const first = result.errors[0];
    throw new CevImportError("invalid_statistics", `CEV data failed validation (${first.field}: ${first.message}).`);
  }
  return result.match;
}

function parseCevHtml(html, sourceUrl) {
  if (typeof html !== "string" || !html.trim()) throw new CevImportError("empty_page", "CEV returned an empty page.");
  const team1 = elementTextById(html, "L_HomeTeam");
  const team2 = elementTextById(html, "L_GuestTeam");
  if (!team1 || !team2 || team1 === team2) throw new CevImportError("format_changed", "The CEV page does not contain two distinct team names.");
  const sets = [];
  let reachedGap = false;
  for (let number = 1; number <= 5; number += 1) {
    const score = elementTextById(html, `L_Set${number}`, false);
    if (!score) {
      reachedGap = true;
      continue;
    }
    if (reachedGap) throw new CevImportError("format_changed", "The CEV page contains nonconsecutive set scores.");
    const match = /^(\d+)\s*-\s*(\d+)$/.exec(score);
    if (!match) throw new CevImportError("format_changed", `Could not read the score for set ${number}.`);
    sets.push({ number, team1: Number(match[1]), team2: Number(match[2]) });
  }
  const players = [
    ...parsePlayerTable(html, "GV_elenco_casa", team1, "GV_elenco_casa"),
    ...parsePlayerTable(html, "GV_elenco_fuori", team2, "GV_elenco_fuori"),
  ];
  const validated = validateThroughCsv({ team1, team2, sets, players });
  return { ...validated, source: { type: "cev", url: validateCevUrl(sourceUrl) } };
}

module.exports = { CEV_HOST, CEV_PATH, CevImportError, validateCevUrl, decodeEntities, parseCevHtml };
