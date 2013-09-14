var cheerio = require('cheerio');

var SituationGoogleDocsHTML = {
  load: cheerio.load,
  context: function ($) { return $("body").children(); },
  pattern: function ($, uel) { return uel[0].name },

  matchers: {
    p: {
      situation: function ($, el, situation) {
        // The summary is the first paragraph that after contributors.
        // If we haven't loaded the contributors block then this probably
        // isn't the summary.
        if (situation.summary || !situation.contributors.length) {
          return false;
        }

        situation.summary = el.text();
        return true;
      },

      module: function ($, el, prev) {
        if (!el.text()) return false;

        return {
          type: "paragraph",
          content: el.text()
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
        if (!el.text()) return false;

        return {
          type: "heading",
          id: el.text(),
          content: el.text()
        }
      }
    },

    h3: {
      section: function ($, el) {
        if (!el.text()) return false;

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
        var items = el.find("li").map(function () {
          var li = $(this);
          return {
            type: "list-item",
            content: li.text()
          };
        });

        // If there's a previous item in the list already,
        // then there's a
        if (prev.type == "list") {
          Array.prototype.push.apply(prev.content, items);
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
        if (situation.contributors.length) {
          return false;
        }

        el.find("tr").each(function () {
          // There are names in each of the last rows of the table.
          var names = $(this).children().last().text().
            split(/\s*[,]\s*/).
            filter(function (n) {
              // Omit blank strings and email addresses.
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
  _inSection: function (path) {
    return path.length > 0;
  },

  _inIgnoredSection: function (ignored, path) {
    return path.some(function (p) {
      return ignored.some(function (ig) { return p == ig; });
    });
  },

  _updateSectionPath: function (section, path) {
    var idx = section.type == "heading" ? 0 : 1;
    path.splice(idx, path.length, section.id);
  },

  _parseNode: function($, uel, situation, ignored, path) {
    var pattern = this.def.pattern($, uel);
    var el = $(uel);

    var matcher = this.def.matchers[pattern];
    if (!matcher) {
      return;
    }

    if (matcher.alias) {
      matcher = this.def.matchers[matcher.alias];
    }

    if (matcher.situation &&
        matcher.situation($, el, situation)) {
      return;
    }

    if (matcher.section) {
      var output = matcher.section($, el);
      if (output) {
        this._updateSectionPath(output, path);
        if (!this._inIgnoredSection(ignored, path)) {
          situation.content.push(output);
        }
        return;
      }
    }

    if (matcher.module) {
      var prev = situation.content[situation.content.length - 1];

      // There must be some sort of section heading at the top of the page
      // before any content modules (e.g. paragraphs).
      if (prev) {
        var output = matcher.module($, el, prev);
        if (output && !this._inIgnoredSection(ignored, path)) {
          situation.content.push(output);
        }
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

    var self = this;
    this.def.context($).each(function () {
      self._parseNode.call(self, $, this, situation, ignored, path);
    });

    return situation;
  }
};

module.exports.SituationImporter = SituationImporter;
module.exports.SituationGoogleDocsHTML = SituationGoogleDocsHTML;
