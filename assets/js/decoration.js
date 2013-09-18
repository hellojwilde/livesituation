App.Decorator = Em.Object.extend({
  _decorations: {},

  decoration: function (name) {
    var decoration = this._decorations[name];
    if (!decoration) {
      var className = Em.String.classify(name) + "Decoration";
      this._decorations[name] = decoration = App.get(className).create();
    }
    return decoration;
  },

  decorate: function (fragment) {
    var content = Handlebars.Utils.escapeExpression(fragment.content);
    return (fragment.decorations || []).reduce(function (prev, cur) {
      return this.decoration(cur.type).wrap(prev, content, cur.data);
    }.bind(this), content);
  }
});

App.Decoration = Em.Object.extend({
  wrap: function (wrappable, content, data) {
    return wrappable;
  }
})

App.CitationsDecoration = App.Decoration.extend({
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