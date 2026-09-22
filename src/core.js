(function (root) {
  "use strict";

  const SET_COLUMNS = Array.from({ length: 5 }, (_, index) => [
    `set_${index + 1}_team_1`,
    `set_${index + 1}_team_2`,
  ]).flat();
  const COUNT_COLUMNS = [
    "points", "serve_attempts", "serve_errors", "serve_aces",
    "reception_attempts", "reception_errors", "attack_attempts",
    "attack_errors", "attack_blocked", "attack_points", "block_points",
  ];
  const PERCENT_COLUMNS = ["reception_positive_pct", "reception_excellent_pct"];
  const MATCH_COLUMNS = ["team_1", "team_2", ...SET_COLUMNS];
  const PLAYER_COLUMNS = ["team", "player", ...COUNT_COLUMNS, ...PERCENT_COLUMNS];
  const REQUIRED_COLUMNS = ["row_type", ...MATCH_COLUMNS, ...PLAYER_COLUMNS];

  function parseCsv(text) {
    const records = [];
    let record = [];
    let field = "";
    let state = "start";
    let line = 1;
    let recordLine = 1;
    const input = text.replace(/^\uFEFF/, "");

    function endRecord() {
      record.push(field);
      if (record.some((value) => value !== "")) records.push({ line: recordLine, values: record });
      record = [];
      field = "";
      state = "start";
      recordLine = line + 1;
    }

    for (let index = 0; index < input.length; index += 1) {
      const char = input[index];
      if (state === "quoted") {
        if (char === '"') {
          if (input[index + 1] === '"') {
            field += '"';
            index += 1;
          } else {
            state = "afterQuote";
          }
        } else if (char === "\r" || char === "\n") {
          if (char === "\r" && input[index + 1] === "\n") index += 1;
          field += "\n";
          line += 1;
        } else {
          field += char;
        }
        continue;
      }
      if (char === ",") {
        record.push(field);
        field = "";
        state = "start";
      } else if (char === "\r" || char === "\n") {
        endRecord();
        if (char === "\r" && input[index + 1] === "\n") index += 1;
        line += 1;
        recordLine = line;
      } else if (char === '"' && state === "start") {
        state = "quoted";
      } else if (char === '"' || state === "afterQuote") {
        throw new Error(`CSV row ${recordLine}: unexpected character after a quoted field`);
      } else {
        field += char;
        state = "plain";
      }
    }
    if (state === "quoted") throw new Error(`CSV row ${recordLine}: unclosed quoted field`);
    if (record.length || field !== "" || state === "afterQuote") endRecord();
    return records;
  }

  function parseMatchCsv(text) {
    const errors = [];
    let records;
    try {
      records = parseCsv(text);
    } catch (error) {
      return { match: null, errors: [{ row: null, field: "CSV", message: error.message }] };
    }
    if (!records.length) return { match: null, errors: [{ row: 1, field: "CSV", message: "The file is empty" }] };

    const header = records[0].values.map((value) => value.trim());
    for (const column of REQUIRED_COLUMNS) {
      if (!header.includes(column)) errors.push({ row: records[0].line, field: column, message: "Missing required column" });
    }
    for (const column of new Set(header)) {
      if (header.filter((value) => value === column).length > 1) {
        errors.push({ row: records[0].line, field: column, message: "Duplicate column" });
      }
    }
    if (errors.length) return { match: null, errors };

    const dataRows = [];
    for (const record of records.slice(1)) {
      if (record.values.length !== header.length) {
        errors.push({ row: record.line, field: "CSV", message: `Expected ${header.length} columns, found ${record.values.length}` });
        continue;
      }
      const values = Object.fromEntries(header.map((column, index) => [column, record.values[index].trim()]));
      dataRows.push({ line: record.line, values });
    }

    const matchRows = dataRows.filter((row) => row.values.row_type === "match");
    const playerRows = dataRows.filter((row) => row.values.row_type === "player");
    for (const row of dataRows) {
      if (row.values.row_type !== "match" && row.values.row_type !== "player") {
        errors.push({ row: row.line, field: "row_type", message: "Must be match or player" });
      }
    }
    if (matchRows.length !== 1) {
      errors.push({ row: null, field: "row_type", message: `Expected exactly one match row, found ${matchRows.length}` });
    }
    if (!playerRows.length) errors.push({ row: null, field: "row_type", message: "At least one player row is required" });

    function error(row, field, message) { errors.push({ row, field, message }); }
    function whole(value, row, field) {
      if (!/^(0|[1-9]\d*)$/.test(value)) {
        error(row, field, "Enter a nonnegative whole number; use 0 for zero");
        return null;
      }
      const number = Number(value);
      if (!Number.isSafeInteger(number)) {
        error(row, field, "Number is too large");
        return null;
      }
      return number;
    }
    function percentage(value, row, field) {
      if (value === "" || !/^(?:\d+\.?\d*|\.\d+)$/.test(value) || Number(value) > 100) {
        error(row, field, "Enter a number from 0 to 100 without a % sign");
        return null;
      }
      return Number(value);
    }
    function blankFields(row, columns) {
      for (const column of columns) {
        if (row.values[column] !== "") error(row.line, column, "Must be blank on this row type");
      }
    }

    let matchData = null;
    if (matchRows.length === 1) {
      const row = matchRows[0];
      const team1 = row.values.team_1;
      const team2 = row.values.team_2;
      if (!team1) error(row.line, "team_1", "Team name is required");
      if (!team2) error(row.line, "team_2", "Team name is required");
      if (team1 && team2 && team1 === team2) error(row.line, "team_2", "Teams must be different");
      blankFields(row, PLAYER_COLUMNS);
      const sets = [];
      let reachedGap = false;
      let wins1 = 0;
      let wins2 = 0;
      for (let index = 1; index <= 5; index += 1) {
        const leftField = `set_${index}_team_1`;
        const rightField = `set_${index}_team_2`;
        const leftText = row.values[leftField];
        const rightText = row.values[rightField];
        if (leftText === "" && rightText === "") {
          reachedGap = true;
          continue;
        }
        if (reachedGap) error(row.line, leftField, "Played sets must be consecutive");
        if (leftText === "" || rightText === "") {
          error(row.line, leftText === "" ? leftField : rightField, "Both teams need points for a played set");
          continue;
        }
        const left = whole(leftText, row.line, leftField);
        const right = whole(rightText, row.line, rightField);
        if (left === null || right === null) continue;
        if (left === right) error(row.line, leftField, "A set must have a winner");
        if (wins1 === 3 || wins2 === 3) error(row.line, leftField, "Match already ended after a team won three sets");
        if (left !== right) {
          if (left > right) wins1 += 1; else wins2 += 1;
        }
        sets.push({ number: index, team1: left, team2: right });
      }
      if (sets.length < 3 || sets.length > 5 || Math.max(wins1, wins2) !== 3 || Math.min(wins1, wins2) > 2) {
        error(row.line, "set_1_team_1", "Three to five sets must give exactly one team three set wins");
      }
      matchData = { team1, team2, sets, score1: wins1, score2: wins2 };
    }

    const players = [];
    const seen = new Set();
    for (const row of playerRows) {
      blankFields(row, MATCH_COLUMNS);
      const team = row.values.team;
      const name = row.values.player;
      if (!team) error(row.line, "team", "Team is required");
      if (!name) error(row.line, "player", "Player name is required");
      if (matchData && team && team !== matchData.team1 && team !== matchData.team2) {
        error(row.line, "team", "Team must match a team in the match row");
      }
      const key = `${team.toLocaleLowerCase()}\u0000${name.toLocaleLowerCase()}`;
      if (seen.has(key)) error(row.line, "player", "Duplicate player on this team");
      seen.add(key);
      const counts = Object.fromEntries(COUNT_COLUMNS.map((column) => [column, whole(row.values[column], row.line, column)]));
      const quality = {};
      if (counts.reception_attempts === 0) {
        for (const column of PERCENT_COLUMNS) {
          if (row.values[column] !== "") error(row.line, column, "Leave blank when reception attempts are zero");
          quality[column] = null;
        }
      } else if (counts.reception_attempts !== null) {
        for (const column of PERCENT_COLUMNS) quality[column] = percentage(row.values[column], row.line, column);
      }
      const c = counts;
      if (c.serve_attempts !== null && c.serve_errors !== null && c.serve_aces !== null && c.serve_errors + c.serve_aces > c.serve_attempts) {
        error(row.line, "serve_attempts", "Serve errors and aces exceed attempts");
      }
      if (c.reception_attempts !== null && c.reception_errors !== null && c.reception_errors > c.reception_attempts) {
        error(row.line, "reception_errors", "Reception errors exceed attempts");
      }
      if ([c.attack_attempts, c.attack_errors, c.attack_blocked, c.attack_points].every((value) => value !== null) &&
          c.attack_errors + c.attack_blocked + c.attack_points > c.attack_attempts) {
        error(row.line, "attack_attempts", "Attack errors, blocked attacks, and points exceed attempts");
      }
      if ([c.points, c.serve_aces, c.attack_points, c.block_points].every((value) => value !== null) &&
          c.points !== c.serve_aces + c.attack_points + c.block_points) {
        error(row.line, "points", `Player points must equal ${c.serve_aces + c.attack_points + c.block_points}`);
      }
      players.push({ team, name, ...counts, ...quality });
    }

    if (errors.length) return { match: null, errors };
    return { match: { ...matchData, players }, errors: [] };
  }

  function rate(numerator, denominator) {
    return denominator === 0 ? null : (numerator / denominator) * 100;
  }

  function attackSuccess(stats) { return rate(stats.attack_points, stats.attack_attempts); }
  function attackEfficiency(stats) {
    return rate(stats.attack_points - stats.attack_errors - stats.attack_blocked, stats.attack_attempts);
  }
  function receptionErrorRate(stats) { return rate(stats.reception_errors, stats.reception_attempts); }

  function teamTotals(match, team) {
    const totals = Object.fromEntries(COUNT_COLUMNS.map((column) => [column, 0]));
    for (const player of match.players.filter((item) => item.team === team)) {
      for (const column of COUNT_COLUMNS) totals[column] += player[column];
    }
    return totals;
  }

  const api = { parseCsv, parseMatchCsv, rate, attackSuccess, attackEfficiency, receptionErrorRate, teamTotals, REQUIRED_COLUMNS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.VBT = api;
})(globalThis);
