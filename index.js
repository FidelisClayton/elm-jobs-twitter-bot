var express = require("express");
var app = express();

app.post("/issues-webhook", function(req, res) {
  console.log(res.body)
  res.send(req.body);
});

var port = process.env.PORT || 3000;
app.listen(port);

console.log("Listening on port " + port);
