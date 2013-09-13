App = Ember.Application.create();

App.Router.map(function() {
  this.resource('situation', { path: '/s/:situation_slug' });
});

App.IndexRoute = Ember.Route.extend({

});

App.SituationIndexRoute = Ember.Route.extend({

});
