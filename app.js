var express = require('express'),
    handlebars = require('express3-handlebars'),
    path = require('path');

var app = express();

app.configure(function () {
  app.set('port', process.env.PORT || 3000);

  app.engine('hbs', handlebars({
    defaultLayout: 'default',
    extname: '.hbs'
  }));

  app.set('views', __dirname + '/views');
  app.set('view engine', 'hbs');

  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
});

app.configure("development", function () {
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.errorHandler());
});

require('./routes/data')(app);

app.listen(app.get('port'));
console.log("livesituation running on " + app.get('port'));
