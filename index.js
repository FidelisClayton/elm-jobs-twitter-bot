require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const Twitter = require('twitter');
const webshot = require('webshot');
const fs = require('fs');

const renderBanner = require('./banner-creator');

var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

const tweetJob = hookData =>  (fileName) => {
  const data = fs.readFileSync(fileName);

  client.post('media/upload', { media: data }, (error, media, response) => {
    if (!error) {
      console.log(media);

      const status = {
        status: hookData.issue.title + ' ' + hookData.issue.html_url + ' #elmlang',
        media_ids: media.media_id_string
      };

      client.post('statuses/update', status, (error, tweet, response) => {
        if (!error) {
          console.log(tweet);
        } else {
          console.log(error)
        }
      });
    } else {
      console.log(error)
    }
  })
};

const messageBuilder = hookData => {
  return hookData.issue.title;
};

const getDataFromTitle = title => {
  const [ location, jobTitle ] = title.split(']');
  const [ city, country ] = location.replace('[', '').split('/');

  return {
    city: city.trim(),
    country: country.trim(),
    jobTitle: jobTitle.trim()
  };
}

console.log(getDataFromTitle('[Natal/Brazil] Teste teste teste'));

app.post("/issues-webhook", function(req, res) {
  const hookData = req.body
  const { issue } = hookData;

  if (hookData.action === 'opened') {
    const { city, country, jobTitle } = getDataFromTitle(issue.title);

    renderBanner({
      id: issue.id,
      city,
      country,
      jobTitle,
      tags: issue.labels
    },
      tweetJob(hookData)
    );

    fs.writeFile("last-response.json", JSON.stringify(req.body), function(err) {
      console.log("The file was saved!");
    });
  }

  res.send(req.body);
});

var port = process.env.PORT || 3000;
app.listen(port);
