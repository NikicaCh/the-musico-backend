const express = require('express')
let scrapeIt = require("scrape-it")
let bodyParser = require('body-parser')
let request = require('request')
let querystring = require('querystring')
let Axios = require("axios")
// let fetch = require("node-fetch")
const $ = require('jquery');
let cookieParser = require("cookie-parser")
// use it before all route definitions
// require('dotenv').config()
const fetch = require("node-fetch")


let url = "";
let prevUrl = "";
let lyrics = "";
let track = "";
let access_token = "";
let refresh_token = "";
let genius = "";




const app = express();
const port = process.env.PORT || 8888;

const urlDevelopment = "http://localhost:8888/callback";
const urlProduction = "https://musico-back.herokuapp.com/callback";
let redirect_uri = urlProduction;
let code = ""

app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())
app.use(cookieParser());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers",  "Content-Type");
    next();
});
// const staticFiles = express.static(path.join(__dirname, '../../client/build'))
// // pass the static files (react app) to the express app. 
// app.use(staticFiles)

let scopes = "user-modify-playback-state user-read-currently-playing user-library-modify streaming user-read-email user-follow-read user-read-private user-library-read playlist-read-private user-read-playback-state app-remote-control playlist-read-collaborative user-read-recently-played user-read-birthdate playlist-modify-public playlist-modify-private user-follow-modify user-top-read";

app.get('/login', function(req, res) {
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
        response_type: 'code',
        client_id: process.env.SPOTIFY_CLIENT_ID,
        scope: "user-modify-playback-state user-read-currently-playing user-library-modify streaming user-read-email user-follow-read user-read-private user-library-read playlist-read-private user-read-playback-state app-remote-control playlist-read-collaborative user-read-recently-played user-read-birthdate playlist-modify-public playlist-modify-private user-follow-modify user-top-read playlist-modify-private user-read-private user-read-email user-read-playback-state playlist-read-private playlist-read-collaborative playlist-modify-public",
        redirect_uri
        }))
    })
    app.get('/callback', function(req, res) {
        code = req.query.code || null
        let authOptions = {
          url: 'https://accounts.spotify.com/api/token',
          form: {
            code: code,
            redirect_uri,
            grant_type: 'authorization_code'
          },
          headers: {
            'Authorization': 'Basic ' + (new Buffer(
              process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
            ).toString('base64'))
          },
          json: true
        }
        request.post(authOptions, function(error, response, body) {
          access_token = body.access_token;
          refresh_token = body.refresh_token;
          genius = process.env.GENIUS_API_KEY;
          uri = "https://themusico.herokuapp.com/";
          res.cookie("access",access_token)
          console.log(access_token)
          res.cookie("genius", genius)
          res.redirect(uri + "?spotify=" + access_token + "&genius=" + genius)
        })
    })

function scrap(url, req) { // recursive function
    scrapeIt(url, {
        lyrics: '.lyrics p'
    })
    .then((data) => {
        if(data && data.data.lyrics !== "") {
            lyrics = data.data.lyrics;
            track = req.body.data.track;
        } else {
            scrap(url, req)
        } 
        // if(data) {
        //     lyrics = data.data.lyrics;
        //     track = req.body.data.track;
        //     console.log("scraped", req.body.data, data.data)
        // } else {
        //     console.log("Lyrics unavailable")
        // }
    })
}

app.post('/', (req, res) => {
if(req.body.data.url !== url) {
    res.set('Content-Type', 'application/json');
    var jsonData = JSON.stringify(req.body);
    res.status(201);
    res.json();
    url = req.body.data.url;
    track = '';
    scrap(url, req)
    }
});

app.get("/", (req, res) => {
    let object = {
        url: url,
        lyrics: lyrics,
        track: track,
    }
    res.send({ scraped: object });
});
app.post("/reportLyrics", (req, res) => {
    res.set('Content-Type', 'application/json');
    res.json();
    let data = req.body;
    console.log(data.data.trackId)
});

app.get("/port", (req, res) => {
    res.send(process.env.port)
})





app.listen(port, () => console.log(`Listening on port ${port}`));