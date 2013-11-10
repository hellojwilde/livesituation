App = Ember.Application.create();

App.Router.map(function() {
  this.resource('situation', { path: '/s/:locale' });
});

App.Router.reopen({
  location: "history"
});

App.IndexRoute = Ember.Route.extend({
  model: function () {
    return $.getJSON("/data");
  }
});

App.SituationRoute = Ember.Route.extend({
  model: function(params) {
    return $.getJSON("/data/" + params.locale);
  }
});
