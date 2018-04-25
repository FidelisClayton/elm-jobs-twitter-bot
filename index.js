require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const Twitter = require('twitter');
const webshot = require('webshot');
const fs = require('fs');
const axios = require('axios');

const renderBanner = require('./banner-creator');
const buildChart = require('./chart-creator');

var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

buildChart()

const tweetJob = hookData =>  (fileName) => {
  const data = fs.readFileSync(fileName);

  client.post('media/upload', { media: data }, (error, media, response) => {
    if (!error) {
      const status = {
        status: formatStatus(hookData.issue.title, hookData.issue.html_url),
        media_ids: media.media_id_string
      };

      client.post('statuses/update', status, (error, tweet, response) => {
        if (error) return console.log(error)

        return console.log("Tweet successfully created")
      });
    } else {
      console.log(error)
    }
  })
};

const formatStatus = (title, url) => {
  if (title.length > 90) {
    return title.substring(0, 90) + '... ' + url + ' #elmlang'
  } else {
    return title + ' ' + url + ' #elmlang'
  }
}

const messageBuilder = hookData => {
  return hookData.issue.title;
};

const getDataFromTitle = title => {
  const [ location, jobTitle ] = title.split(']');
  const [ city, country ] = location.replace('[', '').split('/');

  return {
    city: city ? city.trim() : "",
    country: country ? country.trim() : "",
    jobTitle: jobTitle.trim()
  };
}

app.post("/issues-webhook", function(req, res) {
  const hookData = req.body
  const { issue } = hookData;

  if (hookData.action === 'opened') {
    const { city, country, jobTitle } = getDataFromTitle(issue.title);

    axios.get(`http://tinyurl.com/api-create.php?url=${issue.html_url}`)
      .then(res => {
        renderBanner({
          id: issue.id,
          city,
          country,
          jobTitle,
          tags: issue.labels,
          link: res.data
        },
          tweetJob(hookData)
        );
      })
      .catch(console.log)
  }

  buildChart()

  res.send(req.body);
});

app.use(express.static('public'))

app.get('/build-chart', function(req, res) {
  buildChart()
    .then(() => {
      res.send('chart built')
    })
    .catch(() => {
      res.status(500)
    })
})

var port = process.env.PORT || 3000;
app.listen(port);
