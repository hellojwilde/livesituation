App.ContentView = Ember.CollectionView.extend({
  createChildView: function (viewClass, attrs) {
    switch (attrs.content.type) {
      case "list":
        viewClass = App.ContentListView;
        break;

      case "table":
        viewClass = App.ContentTableView;
        break;

      case "heading":
        viewClass = App.ContentHeadingView;
        break;

      case "subheading":
        viewClass = App.ContentSubheadingView;
        break;

      case "paragraph":
      default:
        viewClass = App.ContentParagraphView;
        break;
    }

    return this._super(viewClass, attrs);
  }
});

App.ContentTextView = Ember.View.extend({
  templateName: "content/text"
});

App.ContentHeadingView = App.ContentTextView.extend({ tagName: "h2" });
App.ContentSubheadingView = App.ContentTextView.extend({ tagName: "h3" });
App.ContentParagraphView = App.ContentTextView.extend({ tagName: "p" });

App.ContentListView = Ember.View.extend({
  tagName: "ul",
  templateName: "content/list"
});

App.ContentTableView = Ember.View.extend({
  tagName: "table",
  templateName: "content/table"
});