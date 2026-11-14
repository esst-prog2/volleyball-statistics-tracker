(function () {
  "use strict";

  const core = globalThis.VBT;
  const cevForm = document.getElementById("cev-form");
  const cevUrl = document.getElementById("cev-url");
  const cevSubmit = document.getElementById("cev-submit");
  const importStatus = document.getElementById("import-status");
  const fileInput = document.getElementById("csv-file");
  const fileStatus = document.getElementById("file-status");
  const errors = document.getElementById("errors");
  const emptyState = document.getElementById("empty-state");
  const report = document.getElementById("report");
  let importVersion = 0;
  const storageKey = "vbt.saved-matches.v1";
  let saved = [];
  const savedStatus = document.getElementById("saved-status");
  const comparisonPlayer = document.getElementById("comparison-player");

  function validMatch(match) {
    const counts = ["points", "serve_attempts", "serve_errors", "serve_aces", "reception_attempts", "reception_errors", "attack_attempts", "attack_errors", "attack_blocked", "attack_points", "block_points"];
    return match && typeof match.team1 === "string" && typeof match.team2 === "string" &&
      [match.score1, match.score2].every(Number.isInteger) &&
      Array.isArray(match.sets) && match.sets.length > 0 && match.sets.every(set =>
        [set.number, set.team1, set.team2].every(Number.isInteger)) &&
      Array.isArray(match.players) && match.players.length > 0 && match.players.every(player =>
        typeof player.name === "string" && [match.team1, match.team2].includes(player.team) &&
        counts.every(key => Number.isInteger(player[key]) && player[key] >= 0) &&
        [player.reception_positive_pct, player.reception_excellent_pct].every(value =>
          value === null || (Number.isFinite(value) && value >= 0 && value <= 100)));
  }

  function persist(next) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      saved = next;
      savedStatus.textContent = "Saved in this browser.";
      renderSaved();
    } catch {
      savedStatus.textContent = "Could not save changes. Browser storage may be full or disabled. Your open report is still available.";
    }
  }

  function saveMatch(match) {
    const key = match.source?.type === "cev" ? match.source.url : JSON.stringify({ ...match, source: undefined });
    persist([{ key, savedAt: new Date().toISOString(), match }, ...saved.filter(item => item.key !== key)]);
  }

  function renderComparison() {
    const container = document.getElementById("comparison-results");
    container.replaceChildren();
    const name = comparisonPlayer.value;
    const table = element("table", "comparison-table");
    const head = element("thead");
    const header = element("tr");
    for (const label of ["Match / saved at", "Team", "Attack success", "Attack efficiency", "Reception error rate"]) {
      const cell = element("th", "", label);
      cell.setAttribute("scope", "col");
      header.append(cell);
    }
    head.append(header);
    const body = element("tbody");
    let appearances = 0;
    for (const item of saved) {
      for (const player of item.match.players.filter(player => player.name === name)) {
        appearances++;
        const row = element("tr");
        for (const value of [`${item.match.team1} vs ${item.match.team2} · ${new Date(item.savedAt).toLocaleString()}`, player.team,
          formattedRate(core.attackSuccess(player)), formattedRate(core.attackEfficiency(player)), formattedRate(core.receptionErrorRate(player))]) {
          row.append(element("td", "", value));
        }
        body.append(row);
      }
    }
    table.append(head, body);
    if (appearances) container.append(table);
    container.append(element("p", "file-status", appearances < 2 ? "Save another match featuring this player to compare performances." : `${appearances} saved appearances. Newest saved first.`));
  }

  function renderSaved() {
    const list = document.getElementById("saved-matches");
    list.replaceChildren();
    if (!saved.length) list.append(element("p", "file-status", "No saved matches yet. Import a match to save it here."));
    for (const item of saved) {
      const row = element("div", "saved-match");
      const open = element("button", "library-button", `${item.match.team1} ${item.match.score1} : ${item.match.score2} ${item.match.team2}`);
      open.type = "button";
      open.addEventListener("click", () => { beginImport(); showMatch(item.match, false); });
      const remove = element("button", "library-button", "Delete");
      remove.type = "button";
      remove.setAttribute("aria-label", `Delete saved match ${item.match.team1} vs ${item.match.team2}`);
      remove.addEventListener("click", () => persist(saved.filter(entry => entry !== item)));
      row.append(open, remove);
      list.append(row);
    }
    const selected = comparisonPlayer.value;
    comparisonPlayer.replaceChildren();
    const names = [...new Set(saved.flatMap(item => item.match.players.map(player => player.name)))].sort();
    for (const name of names) {
      const option = element("option", "", name);
      option.value = name;
      comparisonPlayer.append(option);
    }
    comparisonPlayer.value = names.includes(selected) ? selected : (names[0] || "");
    comparisonPlayer.disabled = !names.length;
    renderComparison();
  }

  comparisonPlayer.addEventListener("change", renderComparison);
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(stored) || !stored.every(item => item && typeof item.key === "string" &&
      typeof item.savedAt === "string" && Number.isFinite(Date.parse(item.savedAt)) && validMatch(item.match))) throw new Error("Invalid saved data");
    saved = stored;
  } catch {
    savedStatus.textContent = "Saved matches could not be loaded. Browser storage may be disabled or the saved data may be damaged.";
  }
  renderSaved();

  if (location.protocol === "file:") document.getElementById("server-notice").hidden = false;

  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }

  function formattedRate(value) {
    return value === null ? "Unavailable" : `${value.toFixed(1)}%`;
  }

  function stat(label, value) {
    const wrap = element("div", "stat");
    wrap.append(element("dt", "stat-label", label), element("dd", "stat-value", String(value)));
    return wrap;
  }

  function statGroup(title, entries) {
    const group = element("section", "stat-group");
    group.append(element("h4", "stat-group-title", title));
    const list = element("dl", "stat-grid");
    for (const [label, value] of entries) list.append(stat(label, value));
    group.append(list);
    return group;
  }

  function renderScore(match) {
    document.getElementById("team-1-name").textContent = match.team1;
    document.getElementById("team-2-name").textContent = match.team2;
    document.getElementById("team-1-sets").textContent = match.score1;
    document.getElementById("team-2-sets").textContent = match.score2;
    const container = document.getElementById("sets");
    container.replaceChildren();
    for (const set of match.sets) {
      const card = element("div", "set-card");
      card.append(element("span", "set-label", `SET ${set.number}`));
      card.append(element("strong", "set-points", `${set.team1} : ${set.team2}`));
      container.append(card);
    }
    const source = document.getElementById("source");
    source.replaceChildren();
    if (match.source?.type === "cev") {
      source.append("Imported from ");
      const link = element("a", "", "CEV match statistics");
      link.href = /^https:\/\/(www-old\.)?cev\.eu\//.test(match.source.url) ? match.source.url : "#";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      source.append(link);
    } else if (match.source?.type === "csv") {
      source.textContent = `Loaded from CSV: ${match.source.name}`;
    }
  }

  function renderTeams(match) {
    const container = document.getElementById("team-summary");
    container.replaceChildren();
    for (const [index, team] of [match.team1, match.team2].entries()) {
      const values = core.teamTotals(match, team);
      const card = element("article", `team-card team-card-${index + 1}`);
      card.append(element("p", "team-number", `TEAM ${index + 1}`));
      card.append(element("h3", "team-card-title", team));
      card.append(statGroup("Points and blocks", [
        ["Player points", values.points], ["Block points", values.block_points],
      ]));
      card.append(statGroup("Serve", [
        ["Attempts", values.serve_attempts], ["Aces", values.serve_aces], ["Errors", values.serve_errors],
      ]));
      card.append(statGroup("Reception", [
        ["Attempts", values.reception_attempts], ["Errors", values.reception_errors],
        ["Error rate", formattedRate(core.receptionErrorRate(values))],
      ]));
      card.append(statGroup("Attack", [
        ["Attempts", values.attack_attempts], ["Points", values.attack_points],
        ["Errors", values.attack_errors], ["Blocked", values.attack_blocked],
        ["Success", formattedRate(core.attackSuccess(values))],
        ["Efficiency", formattedRate(core.attackEfficiency(values))],
      ]));
      container.append(card);
    }
  }

  function renderPlayer(match, selected) {
    const list = document.getElementById("player-list");
    list.replaceChildren();
    for (const team of [match.team1, match.team2]) {
      const group = element("div", "player-team");
      group.append(element("h3", "player-team-name", team));
      for (const player of match.players.filter((item) => item.team === team)) {
        const button = element("button", "player-button", player.name);
        button.type = "button";
        button.setAttribute("aria-pressed", String(player === selected));
        if (player === selected) button.classList.add("selected");
        button.addEventListener("click", () => renderPlayer(match, player));
        group.append(button);
      }
      list.append(group);
    }

    const detail = document.getElementById("player-detail");
    detail.replaceChildren();
    detail.append(element("p", "eyebrow", selected.team));
    detail.append(element("h3", "player-title", selected.name));
    detail.append(element("p", "player-points", `${selected.points} points`));
    detail.append(statGroup("Serve", [
      ["Attempts", selected.serve_attempts], ["Aces", selected.serve_aces], ["Errors", selected.serve_errors],
    ]));
    detail.append(statGroup("Reception", [
      ["Attempts", selected.reception_attempts], ["Errors", selected.reception_errors],
      ["Error rate", formattedRate(core.receptionErrorRate(selected))],
      ["Positive", selected.reception_positive_pct === null ? "Unavailable" : `${selected.reception_positive_pct}%`],
      ["Excellent", selected.reception_excellent_pct === null ? "Unavailable" : `${selected.reception_excellent_pct}%`],
    ]));
    detail.append(statGroup("Attack", [
      ["Attempts", selected.attack_attempts], ["Points", selected.attack_points],
      ["Errors", selected.attack_errors], ["Blocked", selected.attack_blocked],
      ["Success", formattedRate(core.attackSuccess(selected))],
      ["Efficiency", formattedRate(core.attackEfficiency(selected))],
    ]));
    detail.append(statGroup("Block", [["Points", selected.block_points]]));
  }

  function renderErrors(items) {
    errors.replaceChildren();
    errors.append(element("h2", "errors-title", "Could not load this match"));
    const list = element("ul", "error-list");
    for (const item of items) {
      const where = `${item.row === null ? "File" : `Row ${item.row}`} · ${item.field}`;
      list.append(element("li", "", `${where}: ${item.message}`));
    }
    errors.append(list);
    errors.hidden = false;
  }

  function beginImport() {
    errors.hidden = true;
    report.hidden = true;
    emptyState.hidden = false;
    importStatus.textContent = "";
    cevSubmit.disabled = false;
    cevSubmit.textContent = "Import match";
    return ++importVersion;
  }

  function showMatch(match, save = true) {
    renderScore(match);
    renderTeams(match);
    renderPlayer(match, match.players[0]);
    emptyState.hidden = true;
    report.hidden = false;
    if (save) saveMatch(match);
  }

  cevForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const version = beginImport();
    if (location.protocol === "file:") {
      renderErrors([{ row: null, field: "CEV URL", message: "Run npm start and open the local server address before importing a CEV link." }]);
      return;
    }
    cevSubmit.disabled = true;
    cevSubmit.textContent = "Importing…";
    importStatus.textContent = "Retrieving and checking the CEV report…";
    try {
      const response = await fetch("/api/cev-import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: cevUrl.value }),
      });
      const body = await response.json();
      if (version !== importVersion) return;
      if (!response.ok) {
        const failure = new Error(body.error?.message || "Could not import the CEV page.");
        failure.code = body.error?.code;
        throw failure;
      }
      showMatch(body.match);
      importStatus.textContent = `Imported ${body.match.players.length} players.`;
    } catch (error) {
      if (version !== importVersion) return;
      importStatus.textContent = "";
      const guidance = {
        unsupported_url: "Copy the full CEV Match Statistics URL, including its ID parameter.",
        invalid_request: "Enter a CEV Match Statistics URL before importing.",
        format_changed: "The report format is unsupported. Use a CSV in the documented format instead.",
        redirect_rejected: "Open the link on CEV and copy its Match Statistics URL, or use a CSV.",
        page_too_large: "This page exceeds the import limit. Use a CSV instead.",
        internal_error: "Try again. If this continues, check the server log or use a CSV.",
      };
      const retryable = !error.code || ["cev_timeout", "cev_unavailable", "internal_error"].includes(error.code);
      renderErrors([{ row: null, field: "CEV URL", message: `${error.message || "Could not import the CEV page."} ${guidance[error.code] || "Check your connection and try again, or use a CSV."}` }]);
      if (retryable) {
        const retry = element("button", "library-button", "Retry import");
        retry.type = "button";
        retry.addEventListener("click", () => cevForm.requestSubmit());
        errors.append(retry);
      }
    } finally {
      if (version === importVersion) {
        cevSubmit.disabled = false;
        cevSubmit.textContent = "Import match";
      }
    }
  });

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    fileStatus.textContent = file.name;
    const version = beginImport();
    try {
      const text = await file.text();
      if (version !== importVersion) return;
      const result = core.parseMatchCsv(text);
      if (result.errors.length) {
        renderErrors(result.errors);
        return;
      }
      result.match.source = { type: "csv", name: file.name };
      showMatch(result.match);
    } catch (error) {
      if (version !== importVersion) return;
      renderErrors([{ row: null, field: "CSV", message: error.message || "Could not read the file" }]);
    }
  });
})();
