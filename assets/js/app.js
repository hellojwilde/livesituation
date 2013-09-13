App = Ember.Application.create();

App.Router.map(function() {
  this.resource('situation', { path: '/' });
});

App.SituationRoute = Ember.Route.extend({

});
