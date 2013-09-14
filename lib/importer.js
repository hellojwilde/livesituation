var cheerio = require('cheerio'),
    moment = require('moment'),
    bleach = require('bleach.js');

var SituationGoogleDocsHTML = {
  load: cheerio.load,
  context: function ($) { return $("body").children(); },
  pattern: function ($, el) { return el[0].name },

  getHTMLContent: function (el) {
    return bleach.clean(el.html(), { strip: true });
  },

  getCiteDate: function (text) {
    return moment(text, ["h:ma, D MMM","D MMM", "MMM D"]);
  },

  getCiteTitle: function (text) {
    var segments = text.match(/\/\/(?:www\.)?(.+)/)[1].split("/");
    if (segments[0] == "twitter.com") {
      return "@" + segments[1];
    } else {
      return segments[0];
    }
  },

  getCitations: function ($, el) {
    var self = this;
    var citations = [];

    el.find("a").each(function () {
      var a = $(this);
      var date = self.getCiteDate(a.text());
      var href = a.attr("href");

      if (date.isValid()) {
        citations.push({
          updated: date,
          href: href,
          title: self.getCiteTitle(href)
        });
      }
    });

    return citations;
  },

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
          content: this.getHTMLContent(el),
          citations: this.getCitations($, el)
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
        var self = this;
        var items = el.find("li").map(function () {
          var li = $(this);
          return {
            type: "list-item",
            content: self.getHTMLContent(li),
            citations: self.getCitations($, el)
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
        var self = this;
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
                      content: self.getHTMLContent(el),
                      citations: self.getCitations($, el)
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

  _parseNode: function($, el, situation, ignored, path) {
    var pattern = this.def.pattern($, el);
    var matcher = this.def.matchers[pattern];
    if (!matcher) {
      return;
    }

    if (matcher.alias) {
      matcher = this.def.matchers[matcher.alias];
    }

    if (matcher.situation &&
        matcher.situation.call(this.def, $, el, situation)) {
      return;
    }

    if (matcher.section) {
      var output = matcher.section.call(this.def, $, el);
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
        var output = matcher.module.call(this.def, $, el, prev);
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
      self._parseNode.call(self, $, $(this), situation, ignored, path);
    });

    return situation;
  }
};

module.exports.SituationImporter = SituationImporter;
module.exports.SituationGoogleDocsHTML = SituationGoogleDocsHTML;
