const STANDINGS_URL = "https://site.api.espn.com/apis/v2/sports/soccer/{code}/standings";

// Here we will find the element of the page by using its id //
const $ = (id) => document.getElementById(id);
const leagueSelect = $("select-league");
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
    gd: (a,b) => b.goalDiff - a.goalDiff,
    name: (a,b) => a.name.localeCompare(b.name),
};

