'use strict';

// middleware
var StripeWebhook = require('stripe-webhook-middleware'),
isAuthenticated = require('../../middleware/auth').isAuthenticatedApiRequest,
isUnauthenticated = require('../../middleware/auth').isUnauthenticatedApiRequest,
isTokenValidated = require('../../middleware/auth').isTokenValidated,
stripeEvents = require('../../middleware/stripe-events'),
secrets = require('../../config/secrets');

// controllers
var users = require('../../controllers/users-controller'),
main = require('../../controllers/main-controller'),
dashboard = require('../../controllers/dashboard-controller'),
passwords = require('../../controllers/passwords-controller'),
registrations = require('../../controllers/registrations-controller'),
sessions = require('../../controllers/sessions-controller');

var stripeWebhook = new StripeWebhook({
  stripeApiKey: secrets.stripeOptions.apiKey,
  respond: true
});

module.exports = function (app, passport) {
    // Authentication
    app.post('/api/v1/auth/leo', isUnauthenticated, sessions.handleAction); 

    app.post('/api/v1/core/eggman', isTokenValidated, main.handleAction); 
};