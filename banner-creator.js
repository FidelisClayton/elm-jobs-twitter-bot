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
  const fileName = `elm-jobs${id}.png`;

  ejs.renderFile('./banner-template.ejs', { city, country, jobTitle, tags }, (err, data) => {
    if (!err) {
      webshot(data, fileName, webshotOptions, (err) => {
        if (!err)
          callback(fileName);
        else
          console.log(err)
      });
    } else {
      console.log(err);
    }
  });
}

module.exports = renderBanner;
