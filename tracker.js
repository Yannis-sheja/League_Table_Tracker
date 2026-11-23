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

