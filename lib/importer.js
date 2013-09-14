var SituationGoogleDocsHTML = {
  load: cheerio.load,
  context: function ($) { return $("body").children(); },
  pattern: function ($, uel) { return uel[0].name },

  matchers: {
    p: {
      situation: function ($, el, situation) {
        // XXX The summary is the first paragraph that after contributors.
        // If we haven't loaded the contributors block then this probably
        // isn't the summary.
        if (situation.summary || !situation.contributors) {
          return false;
        }

        situation.summary = el.text();
        return true;
      },

      module: function ($, el, prev) {
        return {
          type: "paragraph",
          text: el.text()
        };
      }
    },

    h1: {
      situation: function ($, el, situation) {
        situation.title = el.text();
        return true;
      }
    },

    h2: {
      section: function ($, el) {
        return {
          type: "heading",
          id: el.text(),
          content: el.text()
        }
      }
    },

    h3: {
      section: function ($, el) {
        return {
          type: "subheading",
          id: el.text(),
          content: el.text()
        }
      }
    },

    li: { alias: "ul" },
    ul: {
      module: function ($, el, prev) {
        var items = el.find("li").map(function (li) {
          return {
            type: "list-item",
            content: li.text()
          };
        });

        // If there's a previous item in the list already,
        // then there's a
        if (prev.type == "list") {
          Array.prototype.push.apply(prev, items);
          return;
        }

        return {
          type: "list",
          content: items
        };
      }
    },

    table: {
      situation: function ($, el, situation) {
        if (situation.contributors) {
          return false;
        }

        el.find("tr").each(function () {
          // There are names in each of the last rows of the table.
          var names = $(this).children().last().text().
            split(/\s*[,]\s*/).
            filter(function (n) {
              // XXX Omit blank strings and email addresses.
              return n.length > 0 && n.indexOf("@") == -1;
            });

          Array.prototype.push.apply(situation.contributors, names);
        });

        return true;
      },

      module: function ($, el, prev) {
        return {
          type: "table",
          content:
            el.find("tr").map(function (el) {
              var el = $(this);
              return {
                type: "table-row",
                content:
                  el.find("td").map(function () {
                    var el = $(this);
                    return {
                      type: "table-cell",
                      content: el.text()
                    };
                  })
              };
            })
        };
      }
    }
  }
};

function SituationImporter(def) {
  this.def = def;
}

SituationImporter.prototype = {
  parseNode: function($, uel, situation, ignored, path) {
    var pattern = this.def.pattern(uel);
    var el = $(uel);

    var matcher = this.def.matchers[pattern];
    if (matcher.alias) {
      matcher = this.def.matchers[matcher.alias];
    }

    if (matcher.situation &&
        matcher.situation($, el, situation)) {
      return;
    }

    if (matcher.section) {
      // TODO track the section path here and ignore as needed
      var output = matcher.section($, el);
      if (output) {
        situation.content.push(output);
        return;
      }
    }

    if (matcher.module) {
      // TODO ignore proper sections here
      var prev = situation.content[situation.content.length - 1] || false;
      var output = matcher.module($, el, prev);
      if (output) {
        situation.content.push(output);
      }
    }
  },

  parse: function (input, ignoredSections) {
    var $ = this.def.load(input);
    var situation = {
      type: "situation",
      title: null,
      contributors: [],
      summary: null,
      content: []
    };

    var ignored = ignoredSections || [];
    var path = [];

    this.def.context($).each(function (uel) {
      this.parseNode($, uel, siutation, ignored, path);
    }.bind(this));

    return situation;
  }
};

module.exports.SituationImporter = SituationImporter;
modile.exports.SituationGoogleDocsHTML = SituationGoogleDocsHTML;
