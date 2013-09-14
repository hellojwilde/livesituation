var fs = require('fs'),
    path = require('path'),
    importer = require('../lib/importer');

function isSupportedLocale(req, res, next) {
  var locales = ["en", "es", "pt", "vi"];
  var isSupported = locales.some(function (l) {
    return l == req.params.locale;
  });

  if (isSupported) {
    next();
  } else {
    res.json({ err: "locale not supported" });
  }
}

module.exports = function (app) {
  app.get('/data/:locale', isSupportedLocale, function (req, res) {
    var locale = req.params.locale;
    var file = path.join(__dirname, '..', 'data', locale + '.html');

    fs.readFile(file, 'utf8', function (err, html) {
      if (err) {
        res.json({ err: "unable to load data" });
      } else {
        var def = importer.SituationGoogleDocsHTML;
        var parser = new importer.SituationImporter(def);
        res.json(parser.parse(html, ["Table of Contents"]));
      }
    });
  });
}