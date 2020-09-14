'use strict';

const express             = require('express');
const swig                = require('swig');
const subdomainOffset     = process.env.SUBDOMAIN_OFFSET || 0;
const secrets             = require('./config/secrets');
const path                = require('path');
const favicon             = require('serve-favicon');
const logger              = require('morgan');
const cookieParser        = require('cookie-parser');
const session             = require('express-session');
const FirestoreStore      = require('firestore-store')(session);
const MongoStore          = require('connect-mongo')({ session: session });
const mongoose            = require('mongoose');
const passport            = require('passport');
const bodyParser          = require('body-parser');
const compress            = require('compression')();
const lodash              = require('lodash');
// var Authentication = require('./authentication');
const expressValidator    = require('express-validator');
const errorHandler        = require('./middleware/error');
const viewHelper          = require('./middleware/view-helper');
const flash               = require('express-flash');
const cors                = require('cors');

const firebase            = require('../firebase.js');

var staticDir;

var corsOptions = {
  origin: '*'
};

// express setup
var app = express();

firebase.init(function(firApp) {
  
  if (app.get('env') === 'production') {
    app.locals.production = true;
    swig.setDefaults({ cache: 'memory' });
    staticDir = path.join(__dirname + '/../public');
  } else {
    app.locals.production = false;
    swig.setDefaults({ cache: false });
    staticDir = path.join(__dirname + '/../public');
  }
  
  // This is where all the magic happens!
  // app.engine('html', swig.renderFile);
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');
  app.locals._ = lodash;
  app.locals.stripePubKey = secrets.stripeOptions.stripePubKey;
  
  app.use(favicon(path.join(__dirname + '/../public/favicon.ico')));
  app.use(logger('dev'));
  
  app.use(compress);
  app.use(bodyParser.json({ 
    limit: '500mb' 
  }));
  app.use(bodyParser.urlencoded({ 
    limit: '500mb', 
    extended: true, 
    parameterLimit: 50000 }));
  app.use(expressValidator());
  app.use(cookieParser());
  
  app.use(express.static(staticDir,{ 
    maxage: secrets.oneDay * 21 
  }));
  if(app.get('env') !== 'production'){
    app.use('/styles', express.static(__dirname + '/../.tmp/styles'));
    // app.use('/', routes.styleguide);
  }
  
  app.use(session({
    cookie: {
      maxAge: 60 * 1000 // 1 minute
    },
    secret: secrets.sessionSecret,
    store: new FirestoreStore({
      database: firApp.firestore
    }),
    secret: secrets.db,
    resave: true,
    saveUninitialized: true
  }));
  
  // setup passport authentication
  app.use(passport.initialize());
  app.use(passport.session());
  
  // other
  app.use(flash());
  app.use(cors(corsOptions));
  
  var passportMiddleware = require('./middleware/passport');
  passportMiddleware(passport);
  
  // setup view helper
  app.use(viewHelper);
  
  // setup routes
  var routes = require('./routes');
  routes(app, passport);

  // setup api
  var api = require('./api/v1/api');
  api(app, passport);
  
  /// catch 404 and forwarding to error handler
  app.use(errorHandler.notFound);
  
  /// error handlers
  if (app.get('env') === 'development') {
    app.use(errorHandler.development);
  } else {
    app.use(errorHandler.production);
  }
});

module.exports = app;
