var cheerio = require('cheerio'),
    moment = require('moment'),
    bleach = require('bleach.js'),
    entities = require('entities');

function getCitationDate(text) {
  return moment(text, ["h:ma, D MMM", "MMM D", "D MMM"]);
}

function getCitationTitleFromURI(uri) {
  var segments = uri.match(/\/\/(?:www\.)?(.+)/)[1].split("/");
  if (segments[0] == "twitter.com") {
    return "@" + segments[1];
  } else {
    return segments[0];
  }
}

var SituationGoogleDocsHTML = {
  load: cheerio.load,
  context: function ($) { return $("body").children(); },
  pattern: function ($, el) { return el[0].name },

  getElementFragments: function (el) {
    var $ = cheerio.load(bleach.clean(el.html(), { strip: true }));
    var nodes = $.root()[0].children;
    var fragments = [];

    function isNodeIdxCitation(nodes, idx) {
      var el0 = nodes[idx];
      var el1 = nodes[idx + 1];
      var el2 = nodes[idx + 2];

      if (!(el0 && el0.type == "text" &&
          el1 && el1.type == "tag" && el1.name == "a" &&
          el2 && el2.type == "text")) {
        return false;
      }

      return entities.decode(el0.data, 1).charAt(el0.data.length - 1) == "(" &&
             entities.decode(el2.data, 1).charAt(0) == ")";
    }

    function isNodeEmpty(el) {
      return (el.type == "tag" && el.children.length == 0) ||
             (el.type == "text" && el.data.length == 0);
    }

    function isNodeLink(el) {
      return el.type == "tag" && el.name == "a";
    }

    function getNodeText(el) {
      if (el.type == "tag") {
        return entities.decode($(el).text(), 1);
      } else if (el.type == "text") {
        return entities.decode(el.data, 1);
      }
    }

    for (var idx = 0, len = nodes.length; idx < len; idx++) {
      var el = nodes[idx];
      var fragment = {
        type: "fragment",
        content: getNodeText(el),
        decorations: []
      };

      if (isNodeEmpty(el)) {
        continue;
      }

      if (isNodeLink(el)) {
        fragment.decorations.push({
          type: "link",
          data: { href: $(el).attr("href") }
        });
      }

      if (isNodeIdxCitation(nodes, idx)) {
        var link = $(nodes[idx + 1]);
        var after = nodes[idx + 2];

        fragment.content = fragment.content.replace(/\s*\($/, "");
        after.data = getNodeText(after).replace(/^\)/, "");

        // TODO: merge citations previous section if fragment.content
        // ends up being just whitespace.

        fragment.decorations.push({
          type: "cite",
          data: [{
            href: link.attr("href"),
            date: getCitationDate(link.text()),
            title: getCitationTitleFromURI(link.attr("href"))
          }]
        });

        idx++;
      }

      fragments.push(fragment);
    }

    return fragments;
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
          content: this.getElementFragments(el)
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
          type: (el[0].name == "h2") ? "heading" : "subheading",
          id: el.text(),
          content: this.getElementFragments(el)
        };
      }
    },
    h3: { alias: "h2" },

    ul: {
      module: function ($, el, prev) {
        var self = this;
        var items = el.find("li").map(function () {
          var li = $(this);
          return {
            type: "list-item",
            content: self.getElementFragments(li)
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
    li: { alias: "ul" },

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
                      content: self.getElementFragments(el),
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
