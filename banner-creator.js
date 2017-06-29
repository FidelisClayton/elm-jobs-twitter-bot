const webshot = require('webshot');
const ejs = require('ejs');
const base64 = require('node-base64-image');

const webshotOptions = {
  screenSize: {
    width: 520,
    height: 254
  },
  siteType: 'html',
  quality: 100
};

const renderBanner = ({ id, city, country, jobTitle, tags, link }, callback) => {
  const fileName = `elm-jobs${id}.png`;

  base64.encode('./assets/elm-bg.png', { string: true, local: true }, (err, data) => {
    if (!err) {
      ejs.renderFile('./banner-template.ejs', { city, country, jobTitle, tags, link, image: data }, (err, data) => {
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
  })
}

module.exports = renderBanner;
