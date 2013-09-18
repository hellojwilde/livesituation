var fs = require('fs'),
    path = require('path'),
    importer = require('../lib/importer');

var LOCALES = [
  {
    locale: "en",
    title: "Boston Situation Summary",
  },
  {
    locale: "es",
    title: "Resumen de la situación en Boston"
  },
  {
    locale: "pt",
    title: "Resumo da Situação em Boston"
  },
  {
    locale: "vi",
    title: "Tóm tắt tình hình Boston"
  }
];

function isSupportedLocale(req, res, next) {
  var isNotSupported =
    LOCALES.every(function (l) { return l.locale != req.params.locale });

  if (isNotSupported) {
    res.json({ err: "locale not supported" });
    return;
  }

  next();
}

module.exports = function (app) {
  app.get('/data', function (req, res) {
    res.json(LOCALES);
  });

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