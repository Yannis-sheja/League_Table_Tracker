# League Table Tracker

A football (soccer) standings web app for fans who want to follow their league. Pick a league,
see the full table, then **sort** and **filter** the teams: find the top scorers, the teams
above 20 points, or search for one club.

The app is deployed on two web servers behind a load balancer.

## Links

- Demo video (under 2 minutes): VIDEO_LINK
- Deployed website (through the load balancer): http://18.169.184.99
- Source code: https://github.com/YOUR-USERNAME/sports-tracker

## API used

**ESPN public sports API** (`site.api.espn.com`): free, with **no account and no API key**.

- Endpoint: `https://site.api.espn.com/apis/v2/sports/soccer/{league code}/standings`
- League codes: `eng.1` (Premier League), `esp.1` (La Liga), `ger.1` (Bundesliga),
  `ita.1` (Serie A), `fra.1` (Ligue 1)

This API is public but **unofficial**: ESPN does not publish documentation for it, so its format
could change. The app handles that: if the answer has no table, the user sees a clear error
message instead of a crash.

**API keys and login details:** none are needed. The app has no accounts or passwords, and
there are no secrets in this repository (`.gitignore` also blocks common secret files).

## Features

- 5 leagues to choose from
- Full table: position, played, wins, draws, losses, goals for and against, goal difference, points
- **Sort** by position, points, wins, goals scored, goal difference or team name
- **Filter** by team name (search) and by minimum points; the controls work together
- The top 4 teams are marked with a green stripe
- Responsive: the table scrolls sideways on small screens
- Error handling with clear messages: no internet, server error, unreadable answer, and an
  answer without a table
- Page text is written with `textContent`, so data from the API can never inject HTML

## Project layout

```
sports-tracker/
├── web/
│   ├── index.html         the page structure
│   ├── style.css          colours and layout
│   └── app.js             the logic (calls the API, sorts, filters)
├── .gitignore
└── README.md
```

## Run it on your computer

The app is only static files, so you need no installation. Run a small local server and open
http://localhost:8000 (you need Python 3 for this one command; you can also just open
`web/index.html` in a browser):

```bash
cd web
python3 -m http.server 8000
```

## Deployment

The web app is just static files (HTML, CSS, JavaScript), so deploying means copying `web/`
into nginx's folder on both web servers.

| Server | Role | IP |
|---|---|---|
| web-01 | nginx web server | 18.170.217.131 |
| web-02 | nginx web server | 18.132.98.220 |
| lb-01 | HAProxy load balancer | 18.169.184.99 |

### 1. Deploy the app to each web server

Do these steps on web-01, then repeat them on web-02:

```bash
ssh -i <path-to-key> ubuntu@<server-ip>
sudo apt-get install -y git                       # only if git is missing
git clone https://github.com/YOUR-USERNAME/sports-tracker.git
sudo cp sports-tracker/web/* /var/www/html/       # nginx serves this folder
curl -sI localhost | grep -iE "HTTP|x-served-by"  # expect 200 OK and the server's name
exit
```

To publish a later change, push it to GitHub, then on each server run:

```bash
cd sports-tracker && git pull && sudo cp web/* /var/www/html/
```

### 2. Load balancer (HAProxy on lb-01)

`/etc/haproxy/haproxy.cfg` on lb-01 contains:

```
frontend http-in
    bind *:80
    default_backend web-backend

backend web-backend
    balance roundrobin
    server 7402-web-01 18.170.217.131:80 check
    server 7402-web-02 18.132.98.220:80 check
```

- `frontend http-in` listens for visitors on port 80.
- `backend web-backend` lists the web servers.
- `balance roundrobin` sends request 1 to web-01, request 2 to web-02, request 3 to web-01, and so on.
- `check` makes HAProxy stop using a server that is down.

HAProxy runs through its init script: `sudo service haproxy status` or `sudo service haproxy restart`.

### 3. Test the load balancer

Each web server adds an `X-Served-By` header with its own name. Ask the load balancer four times:

```bash
for i in 1 2 3 4; do curl -sI http://18.169.184.99 | grep -i x-served-by; done
```

The answers alternate between `7402-web-01` and `7402-web-02`, which shows that traffic is shared.
Then open http://18.169.184.99 in a browser: the app works the same on either server.

To test a failure, run `sudo service nginx stop` on web-01. Every answer now comes from web-02.
Run `sudo service nginx start` to bring it back.

## Challenges and how I solved them

- **Choosing an API:** I first looked at TheSportsDB, but its free key returns only a few rows, which
  is too little for sorting and filtering. ESPN's public API returns full tables without a key.
- **An unofficial API can change:** a helper function returns 0 for any missing number, and a clear
  error is shown when the answer has no table.
- **Server setup:** my setup scripts worked on my own server but failed on a fresh machine because
  they edited nginx's default file with `sed`. I fixed them by writing the whole config file so the
  result is always the same.
- **SSH access:** the servers stayed empty until I added my SSH public key to my intranet profile.

## Credits

- Standings data: [ESPN](https://www.espn.com/soccer/) public sports API (unofficial)
- nginx and HAProxy setup from the ALU system engineering projects