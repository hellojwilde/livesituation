App.TimeView = Ember.View.extend({
  tagName: "time",
  attributeBindings: ['content:datetime'],
  template: Ember.Handlebars.compile("{{view.pretty}}"),

  pretty: function () {
    return moment(this.get("content")).fromNow()
  }.property("content")
});

App.ContentCitationsView = Ember.View.extend({
  templateName: "content/citations",
  tagName: "span",
  classNames: ["citations"]
});

App.ContentTextView = Ember.View.extend({
  templateName: "content/text",
  classNames: ["text"]
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

App.ContentViewBindings = {
  heading: App.ContentHeadingView,
  subheading: App.ContentSubheadingView,
  paragraph: App.ContentParagraphView,
  list: App.ContentListView,
  table: App.ContentTableView,

  // In the event that we're served an element that we can't deal with.
  default: App.ContentParagraphView
};

App.ContentView = Ember.CollectionView.extend({
  createChildView: function (viewClass, attrs) {
    viewClass = App.ContentViewBindings[attrs.content.type] ||
                App.ContentViewBindings.default;

    return this._super(viewClass, attrs);
  }
});