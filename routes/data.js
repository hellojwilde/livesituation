var fs = require('fs'),
    path = require('path'),
    cheerio = require('cheerio');

function isSupportedLocale(req, res, next) {
  var locales = ["en"];
  var isSupported = locales.some(function (l) {
    return l == req.params.locale;
  });
  if (isSupported) next();
}

function getSituationForLocale(locale, callback) {
  var file = path.join(__dirname, '..', 'data', locale + '.html');
  fs.readFile(file, 'utf8', function (err, html) {
    if (err) {
      callback(err, null);
      return;
    }

    getSituationForHTML(html, callback);
  });
}

function getSituationForHTML(html, callback) {
  var $ = cheerio.load(html);

  var situation = {
    type: "situation",
    title: null,
    contributors: [],
    summary: null,
    children: []
  };

  $("body").children().each(function () {
    var tagName = this[0].name;
    var el = $(this);

    switch (tagName) {
      case "h1":
        situation.title = el.text();
        break;

      case "h2":
      case "h3":
        situation.children.push({
          type: (tagName == "h2") ? "heading" : "subheading",
          text: el.text()
        });
        break;

      case "ol":
      case "ul":
        var last = situation.children[situation.children.length - 1];
        var children =
          el.find("li").map(function () {
            return {
              type: "list-item",
              text: $(this).text()
            };
          });

        if (last && last.type == "list") {
          Array.prototype.push.apply(last.children, children);
        } else {
          situation.children.push({
            type: "list",
            children: children
          });
        }
        break;

      case "table":
        if (!situation.contributors.length) {
          el.find("tr").each(function () {
            var names = $(this).children().last().text().
              split(/s*[,]\s*/).
              filter(function (n) {
                return n.length > 0 && n.indexOf("@") == -1;
              });

            Array.prototype.push.apply(situation.contributors, names);
          });
        } else {
          situation.children.push({
            type: "table",
            children: el.find("tr").map(function () {
              return {
                type: "table-row",
                children: $(this).find("td").map(function () {
                  return {
                    type: "table-cell",
                    text: $(this).text()
                  }
                })
              }
            })
          });
        }
        break;

      case "p":
        if (!situation.contributors.length) {
          return;
        }

        if (!situation.summary) {
          situation.summary = el.text();
          return;
        }

        if (situation.children.length && el.text().length) {
          situation.children.push({
            type: "paragraph",
            text: $(this).text()
          });
        }
        break;
    }
  });

  callback(null, situation);
}

module.exports = function (app) {
  app.get('/data/:locale', isSupportedLocale, function (req, res) {
    getSituationForLocale(req.params.locale, function (err, situation) {
      res.json(err ? { error: err } : situation);
    });
  });
}