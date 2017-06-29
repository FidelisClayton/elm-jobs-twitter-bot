const webshot = require('webshot');
const ejs = require('ejs')

const webshotOptions = {
  screenSize: {
    width: 520,
    height: 254
  },
  siteType: 'html',
  quality: 100
};

const renderBanner = ({ id, city, country, jobTitle, tags }, callback) => {
  ejs.renderFile('./banner-template', { city, country, jobTitle, tags }, (err, data) => {
    if (!err) {
      webshot(data, `elm-job-${id}.png`, webshotOptions, (err) => {
        if (!err)
          callback();
      });
    }
  });
}

module.exports = renderBanner;
