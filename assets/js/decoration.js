App.Decorator = Em.Object.extend({
  decoration: function (name) {
    var decoration = this._decorations[name];
    if (!decoration) {
      var className = Em.String.classify(name) + "Decoration";
      this._decorations[name] = decoration = App.get(className).create();
    }
    return decoration;
  },

  decorate: function (fragment) {
    return (fragment.decorations || []).reduce(function (prev, cur) {
      return this.decoration(cur).wrap(prev);
    }.bind(this), fragment.content);
  }
});

App.Decoration = Em.Object.extend({
  wrap: function (wrappable, content, data) {
    return wrappable;
  }
})

App.CitationDecoration = App.Decoration.extend({
  wrap: function (wrappable, content, citations) {
    var cited = "<span class='cited'>" + wrappable + "</span>";
    var citations = "<span class='citations'>" + citations.join(" ") + "</span>";
    return cited + citations;
  }
});

App.LinkDecoration = App.Decoration.extend({
  wrap: function (wrappable, content, attrs) {
    return "<a href='" + (attrs.href || "#") + "'>" + wrappable + "</a>";
  }
});