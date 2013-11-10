App.TextContentView = Em.View.extend({
  updated: function () {
    this.rerender();
  }.observes("content.content.@each"),

  render: function (buffer) {
    var fragments = this.get("content.content");
    var decorator = App.Decorator.create();

    (fragments || []).forEach(function (fragment) {
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