'use strict';

var Stripe = require('stripe'), stripe;
var options;

module.exports = {
  init: function initWith(opts) {
    options = opts;
    stripe = Stripe(opts.apiKey);
    return module.exports;
  }, 

  getPlans: function retrievePlans() {
    return options.planData;
  },

  createCustomer: function createCustomerFrom(user, cb) {
    stripe.customers.create({
      email: user.email_address
    }, function(err, customer){
      if (err) return cb(err, null);
      return cb(null, customer.id);
    });
  },

  setCard: function setCardFor(user, stripeToken, cb) {
    var cardHandler = function(err, customer) {
      if (err) return cb(err, null);
      var results;
      if (!user.stripe.customer_id) {
        // Create card
        results[customerId] = customer.id;
      }

      var card = customer.cards ? customer.cards.data[0] : customer.sources.data[0];
      results[lastFour] = card.last4;
      cb(null, results);
    };

    if (user.stripe.customer_id) {
      stripe.customers.update(user.stripe.customer_id, { 
        card: stripeToken
      }, cardHandler);
    } else {
      stripe.customers.create({
        email: user.email_address,
        card: stripeToken
      }, cardHandler);
    }
  },

  setPlan: function setPlanFor(user, plan, stripeToken, cb) {
    var subscriptionHandler = function(err, subscription) {
      if (err) return cb(err, null);
      return (null, {
        stripePlan: plan,
        subscriptionId: subscription.id
      });
    };

    var createSubscription = function() {
      stripe.customers.createSubscription(
        user.stripe.customer_id,
        {
          plan: plan
        },
        subscriptionHandler
      );
    };

    if (stripeToken) {
      this.setCard(user, stripeToken, function(err, user) {
        if (err) return cb(err, null);
        createSubscription();
      });
    } else {
      if (user.stripe.subscription_id) {
        // update subscription
        stripe.customers.updateSubscription(
          user.stripe.customer_id,
          user.stripe.subscription_id,
          { 
            plan: plan
          },
          subscriptionHandler
        );
      } else {
        createSubscription();
      }
    }
  },

  updateEmail: function updateEmailForStripeFor(user, cb) {
    if (!user.stripe.customer_id) return cb({
      message: "Something went wrong trying to update email for stripe customer"
    }, false);
    stripe.customers.update(user.stripe.customer_id, {
      email: user.email_address
    }, function(err, customer) {
      cb(err, true);
    });
  },

  cancelStripe: function cancelStripeFor(user, cb) {
    if (user.stripe.customer_id) {
      stripe.customers.del(
        user.stripe.customer_id
      ).then(function(confirmation) {
        console.log('Stripe confirmation');
        console.log(confirmation);
        cb(null, true);
      }, function(err) {
        if (err) return cb(err, false)
        cb({
          'message': 'Something went wrong when trying to delete stripe information for user.'
        }, false);
      });
    } else {
      return cb({
        'message': 'Stripe customer does not exist for user.'
      }, false);
    }
  }
}