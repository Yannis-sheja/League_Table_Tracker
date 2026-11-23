const STANDINGS_URL = "https://site.api.espn.com/apis/v2/sports/soccer/{code}/standings";

// Here we will find the element of the page by using its id //
const $ = (id) => document.getElementById(id);
const leagueSelect = $("league-select");
const message = $("message");
const results = $("results");
const leagueTitle = $("league-title");
const teamSearch = $("search-team");
const sortSelect = $("sort-select");
const minPointsInput = $("min-points");
const tableBody = $("table-body");

// All the teams will be sorted here //
let allTeams = [];

// Name for each number by using ESPN
const FIELDS = {
    played: "gamesPlayed", wins: "wins", draws: "ties", losses: "losses",
    goalsFor: "pointsFor", goalsAgainst: "pointsAgainst",
    goalDiff: "pointDifferential", points: "points"
};

// SORT compares two teams //
const SORTERS = {
    rank: (a,b) => a.rank - b.rank,
    points: (a,b) => b.points - a.points,
    wins: (a,b) => b.wins - a.wins,
    goals: (a,b) => b.goalsFor - a.goalsFor,
    gd: (a,b) => b.goalDiff -a.goalDiff,
    name: (a,b) =>a.name.localeCompare(b.name),
}

// Here a message is shown to the user where isError = true makes it red //
function showMessage(text, isError = false) {
    message.textContent = text;
    message.className = isError ? "error": "";
}

// The following function finds one number like points in team's list of stats//
// And ESPN sends the stats //
function readStats(stats, name) {
    const stat = stats.find((s) => s.name === name);
    return Number(stat?.value) || 0; // Value that is missing or broken becomes 0
}

//This turns the answer of ESPN into a simple list like one object per team
function parseStandings(data) {
    //Some answers contain the table inside children and the remaining at the top
    const groups= data?.children?.length ? data.children : [data];

    return groups.flatMap((group) =>
        (group?.standings?.entries || []).map((entry, index) => {
            const stats = entry.stats || [];
            const team = {
                rank: readStats(stats, "rank") || index + 1,
                name: entry.team?.displayName ?? "Unknown team",
            };
            for (const [field, statName] of Object.entries(FIELDS)) {
                team[field] = readStats(stats, statName);
            }
            return team;
        })
    );
}

//This will help download the table of one league
async function loadleague(code) {
    showMessage("Loading...");
    results.hidden = true ;

    try {
        const response = await fetch(STANDINGS_URL.replace("{code}", code));
        if (!response.ok) throw new Error(`The sport service had an issue (${response.status}.`);

        const teams = parseStandings(await response.json());
        if (teams.length === 0) {
            throw new Error("The answer did not have a league table. The sports service may have changed. ");
        }

        allTeams = teams;
        leagueTitle.textContent = leagueSelect.selectedOptions[0].text + " - standings";
        renderTable();
        results.hidden = false;
        showMessage("");
    }   catch (error) {
        // If a request failed, they will be a TypeError //
        showMessage(
            error instanceof TypeError
                ? "Could not reach the sports service. Check your internet connection."
                : error.message,
            true
        );
    }
}

//Here, we will be building a table row from a list of values //
function makeRow(values, className) {
    const row = document.createElement("tr");
    if (className) row.className = className;
    row.append(...values.map((value) =>{
        const cell = document.createElement("td");
        cell.textContent = value;
        return cell;
    }));
    return row;
}

//Here, it applies the search, filter and sort and then the table is drawn //
function renderTable() {
    const search = teamSearch.value.trim().toLowerCase();
    const minPoints = minPointsInput.value; 

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

//Loading a new table if the league starts to changes
leagueSelect.addEventListener("change", () => loadLeague(leagueSelect.value));

//If the user changes the controls then the table is redrawn // 
[teamSearch, sortSelect, minPointsInput].forEach((control) => control.addEventListener("input", renderTable));

// If the page opens, the first league is loaded
loadleague(leagueSelect.value);


