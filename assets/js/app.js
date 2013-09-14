App = Ember.Application.create();

App.Router.map(function() {
  this.resource('situation', { path: '/s/:locale' });
});

App.IndexRoute = Ember.Route.extend({
  model: function () {

  }
});

App.SituationRoute = Ember.Route.extend({
  model: function(params) {
    return $.getJSON("/data/" + params.locale);
  }
});
