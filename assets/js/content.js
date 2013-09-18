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

App.TextContentView = Em.View.extend({
  updated: function () {
    this.rerender();
  }.observes("content.content.@each"),

  render: function (buffer) {
    var fragments = this.get("content.content");
    var decorator = App.Decorator.create();

    fragments.forEach(function (fragment) {
      var decorated = decorator.decorate(fragment);
      buffer.push(decorated);
    }.bind(this));
  }
});

App.HeadingContentView = App.TextContentView.extend({
  tagName: "h2"
});

App.SubheadingContentView = App.TextContentView.extend({
  tagName: "h3"
});

App.ParagraphContentView = App.TextContentView.extend({
  tagName: "p"
});

App.ListContentView = Em.View.extend({
  tagName: "ul",
  templateName: "content/list"
});

App.TableContentView = Em.View.extend({
  tagName: "table",
  templateName: "content/table"
});

App.ContentView = Em.CollectionView.extend({
  defaultChildViewClass: App.TextContentView,

  createChildView: function (viewClass, attrs) {
    var viewClassName = Em.String.classify(attrs.content.type) + "ContentView";
    var defaultChildViewClass = this.get("defaultChildViewClass");

    viewClass = App.getWithDefault(viewClassName, defaultChildViewClass);
    return this._super(viewClass, attrs);
  }
});