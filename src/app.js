(function () {
  "use strict";

  const core = globalThis.VBT;
  const fileInput = document.getElementById("csv-file");
  const fileStatus = document.getElementById("file-status");
  const errors = document.getElementById("errors");
  const emptyState = document.getElementById("empty-state");
  const report = document.getElementById("report");
  let currentMatch = null;

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

  function clearReport() {
    currentMatch = null;
    report.hidden = true;
    emptyState.hidden = false;
  }

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    fileStatus.textContent = file.name;
    errors.hidden = true;
    clearReport();
    try {
      const text = await file.text();
      const result = core.parseMatchCsv(text);
      if (result.errors.length) {
        renderErrors(result.errors);
        return;
      }
      currentMatch = result.match;
      renderScore(currentMatch);
      renderTeams(currentMatch);
      renderPlayer(currentMatch, currentMatch.players[0]);
      emptyState.hidden = true;
      report.hidden = false;
    } catch (error) {
      renderErrors([{ row: null, field: "CSV", message: error.message || "Could not read the file" }]);
    }
  });
})();
