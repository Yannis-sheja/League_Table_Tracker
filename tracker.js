const STANDINGS_URL = "https://site.api.espn.com/apis/v2/sports/soccer/{code}/standings";

// A short helper: find an element of the page by its id
const $ = (id) => document.getElementById(id);
const leagueSelect = $("league-select");
const message = $("message");
const results = $("results");
const leagueTitle = $("league-title");
const teamSearch = $("team-search");
const sortSelect = $("sort-select");
const minPointsInput = $("min-points");
const tableBody = $("table-body");

// All the teams are stored here, so we can sort and filter without calling the API again
let allTeams = [];

// Our name for each number  ->  the name ESPN uses for it
const FIELDS = {
  played: "gamesPlayed", wins: "wins", draws: "ties", losses: "losses",
  goalsFor: "pointsFor", goalsAgainst: "pointsAgainst",
  goalDiff: "pointDifferential", points: "points",
};

// Each sort option is a small function that compares two teams
const SORTERS = {
  rank: (a, b) => a.rank - b.rank,
  points: (a, b) => b.points - a.points,
  wins: (a, b) => b.wins - a.wins,
  goals: (a, b) => b.goalsFor - a.goalsFor,
  gd: (a, b) => b.goalDiff - a.goalDiff,
  name: (a, b) => a.name.localeCompare(b.name),
};

// Show a message to the user (isError = true makes it red)
function showMessage(text, isError = false) {
  message.textContent = text;
  message.className = isError ? "error" : "";
}

// Find one number (like "points") in a team's list of stats.
// ESPN sends stats like: [{ name: "points", value: 25 }, { name: "wins", value: 8 }]
function readStat(stats, name) {
  const stat = stats.find((s) => s.name === name);
  return Number(stat?.value) || 0; // a missing or broken value becomes 0
}

// Turn ESPN's big answer into a simple list: one object per team
function parseStandings(data) {
  // Some answers have the table inside "children", others at the top
  const groups = data?.children?.length ? data.children : [data];

  return groups.flatMap((group) =>
    (group?.standings?.entries || []).map((entry, index) => {
      const stats = entry.stats || [];
      const team = {
        rank: readStat(stats, "rank") || index + 1,
        name: entry.team?.displayName ?? "Unknown team",
      };
      for (const [field, statName] of Object.entries(FIELDS)) {
        team[field] = readStat(stats, statName);
      }
      return team;
    })
  );
}

// Download the table of one league
async function loadLeague(code) {
  showMessage("Loading...");
  results.hidden = true;

  try {
    const response = await fetch(STANDINGS_URL.replace("{code}", code));
    if (!response.ok) throw new Error(`The sports service had a problem (${response.status}).`);

    const teams = parseStandings(await response.json());
    if (teams.length === 0) {
      throw new Error("The answer did not contain a league table. The sports service may have changed.");
    }

    allTeams = teams;
    leagueTitle.textContent = leagueSelect.selectedOptions[0].text + " - standings";
    renderTable();
    results.hidden = false;
    showMessage("");
  } catch (error) {
    // A TypeError means the request itself failed (no internet, or the browser blocked it)
    showMessage(
      error instanceof TypeError
        ? "Could not reach the sports service. Check your internet connection."
        : error.message,
      true
    );
  }
}

// Build one table row from a list of values (textContent keeps API text from injecting HTML)
function makeRow(values, className) {
  const row = document.createElement("tr");
  if (className) row.className = className;
  row.append(...values.map((value) => {
    const cell = document.createElement("td");
    cell.textContent = value;
    return cell;
  }));
  return row;
}

// Apply the search, filter and sorting, then draw the table
function renderTable() {
  const search = teamSearch.value.trim().toLowerCase();
  const minPoints = minPointsInput.value; // text; "" means "not used"

  const teams = allTeams
    .filter((team) => team.name.toLowerCase().includes(search))
    .filter((team) => minPoints === "" || team.points >= Number(minPoints))
    .sort(SORTERS[sortSelect.value]);

  if (teams.length === 0) {
    const row = makeRow(["No teams match your filters."]);
    row.firstChild.colSpan = 10;
    tableBody.replaceChildren(row);
    return;
  }

  tableBody.replaceChildren(...teams.map((team) => makeRow(
    [team.rank, team.name, team.played, team.wins, team.draws, team.losses,
     team.goalsFor, team.goalsAgainst, (team.goalDiff > 0 ? "+" : "") + team.goalDiff, team.points],
    team.rank <= 4 ? "top-four" : ""
  )));
}

// Load a new table when the league changes
leagueSelect.addEventListener("change", () => loadLeague(leagueSelect.value));

// Redraw the table whenever the user changes a control
[teamSearch, sortSelect, minPointsInput].forEach((control) => control.addEventListener("input", renderTable));

// Load the first league when the page opens
loadLeague(leagueSelect.value);
