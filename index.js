require('dotenv').config()
var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var Twitter = require('twitter');

var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

const tweetJob = hookData => {
  client.post('statuses/update', { status: hookData.issue.title + ' ' + hookData.issue.html_url })
}

const messageBuilder = hookData => {
  return hookData.issue.title
}

app.post("/issues-webhook", function(req, res) {
  const hookData = req.body

  if (hookData.action === 'opened') {
    tweetJob(hookData)
  }

  res.send(req.body);
});

var port = process.env.PORT || 3000;
app.listen(port);
