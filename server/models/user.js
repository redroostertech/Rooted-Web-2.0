var stripeCustomer                    = require('./plugins/stripe-customer');
var secrets                           = require('../config/secrets');
var firebase                          = require('../../firebase');
var async                             = require('async');
var randomstring                      = require('randomstring');
var Meetings                          = require('./meeting');
var crudHelper                        = require('../middleware/db-crud-helper');
var jwt                               = require('jsonwebtoken');

// userSchema.methods.gravatar = function(size) {
//   if (!size) size = 200;

//   if (!this.email) {
//     return 'https://gravatar.com/avatar/?s=' + size + '&d=retro';
//   }

//   var md5 = crypto.createHash('md5').update(this.email).digest('hex');
//   return 'https://gravatar.com/avatar/' + md5 + '?s=' + size + '&d=retro';
// };

var getOptions = { 
  source: 'cache' 
};

const collection = 'users';

var stripeCustomer = stripeCustomer.init(secrets.stripeOptions);

function retrieveUserById(id, reference, completionHandler) {
  var refCollection = reference.collection(collection);
  refCollection.where('id', '==', id).get(getOptions).then(function(querySnapshot) {
      var users = new Array();
      async.each(querySnapshot.docs, function(doc, completion) {
        var userDoc = doc.data();
          userDoc.key = doc.id;

          // Clean Location
          userDoc.location = {
              address_name: userDoc.address_name,
              address_description: userDoc.address_description,
              address_line_4: userDoc.address_line_4,
              address_line_3: userDoc.address_line_3,
              address_country: userDoc.address_country,
              address_city: userDoc.address_city,
              address_line_1: userDoc.addressLine1,
              address_line_2: userDoc.addressLine2,
              address_coordinates: {
                  address_long: userDoc.address_long,
                  address_lat: userDoc.address_lat,
              },
              address_state: userDoc.address_state,
              address_zip: userDoc.address_zip,
          }

          var identities = new Array();
          if (userDoc.identity_types) {
            async.each(userDoc.identity_types, function(identity_type, cm) {
                var identity = {
                  type: identity_type
                }
                switch (identity_type) {
                  case 'login':
                    identity['email'] = userDoc.email_address;
                  default:
                    break;
                }
                identities.push(identity)
                cm();
              }, function (err) {
                if (err) return console.log('Error adding identity');
            });
          }

          userDoc.identities = identities;

          userDoc.stripe = {
            customer_id: userDoc.stripe_customer_id,
            last_four: userDoc.stripe_last_four,
            plan: userDoc.stripe_plan,
            stripe_subscription_id: userDoc.stripe_subscription_id,
          }
          async.parallel({
            preferences: function(callback) {
                var userPreferences = new Array();
                async.each(userDoc.user_preferences, function(preference, cb) {
                    let prefCollection = reference.collection('user_preferences');
                    prefCollection.where('id','==', preference).get(getOptions).then(function(querysnapshot) {
                        async.each(querysnapshot.docs, function(d, c) {
                            var prefdata = d.data();
                            prefdata.key = d.id;
                            userPreferences.push(prefdata);
                            c();
                        }, function(_e) {
                            if (_e) { 
                                console.log(_e.message);
                                cb(_e);
                            } else {
                                cb();
                            }
                        });
                    }).catch(function (error) {
                        if (error) {
                            console.log(error.message);
                            cb(error);
                        }
                    });
                }, function(e) {
                    if (e) {
                        console.error(e.message);
                        callback(e, null);
                    } else {
                        callback(null, userPreferences);
                    }
                });
            },
            account_type: function(callback) {
                var accountTypes = new Array();
                let prefCollection = reference.collection('account_roles');
                prefCollection.where('id','==', userDoc.account_type_id).get(getOptions).then(function(querysnapshot) {
                    async.each(querysnapshot.docs, function(d, c) {
                        var prefdata = d.data();
                        prefdata.key = d.id;
                        accountTypes.push(prefdata);
                        c();
                    }, function(_e) {
                        if (_e) { 
                            console.log(_e.message);
                            callback(_e, accountTypes);
                        } else {
                            callback(null, accountTypes);
                        }
                    });
                }).catch(function (error) {
                    if (error) {
                        console.log(error.message);
                        callback(error, null);
                    }
                });
            }, 
            meetings: function(callback) {
                Meetings.getAllMeetingsForUserId(
                  {
                    'userID': userDoc.uid
                  }, function(error, meetings) {
                    if (error) return callback(error, new Array());
      
                    if (!meetings) {
                      return callback(null, new Array());
                    }
                    callback(null, meetings);
                  }
                );
            }
          }, function(error, results) {
              console.log(results);
              console.log(error);

              if (error) return completionHandler(error, null);

              if (results.preferences) {
                  userDoc.preferences = results.preferences
              }

              if (results.account_type) {
                  userDoc.account_type = results.account_type
              }

              if (results.meetings) {
                  userDoc.meetings = results.meetings
              }

              users.push(userDoc);
              completion();
          });
    }, function (err) {
        if (err) return completionHandler(err, null);
        let data = {
            "uid": uid,
            "user": users
        }
        console.log(data);
        completionHandler(err, users);
    });
  }).catch(function (error) {
    if (error) {
      completionHandler(error, null);
    }
  });  
}

function retrieveUserBy(uid, reference, completionHandler) {
  var refCollection = reference.collection(collection);
  refCollection.where('uid', '==', uid).get(getOptions).then(function(querySnapshot) {
      var users = new Array();
      async.each(querySnapshot.docs, function(doc, completion) {
        var userDoc = doc.data();
          userDoc.key = doc.id;

          // Clean Location
          userDoc.location = {
              address_name: userDoc.address_name,
              address_description: userDoc.address_description,
              address_line_4: userDoc.address_line_4,
              address_line_3: userDoc.address_line_3,
              address_country: userDoc.address_country,
              address_city: userDoc.address_city,
              address_line_1: userDoc.addressLine1,
              address_line_2: userDoc.addressLine2,
              address_coordinates: {
                  address_long: userDoc.address_long,
                  address_lat: userDoc.address_lat,
              },
              address_state: userDoc.address_state,
              address_zip: userDoc.address_zip,
          }

          var identities = new Array();
          if (userDoc.identity_types) {
            async.each(userDoc.identity_types, function(identity_type, cm) {
                var identity = {
                  type: identity_type
                }
                switch (identity_type) {
                  case 'login':
                    identity['email'] = userDoc.email_address;
                  default:
                    break;
                }
                identities.push(identity)
                cm();
              }, function (err) {
                if (err) return console.log('Error adding identity');
            });
          }

          userDoc.identities = identities;

          userDoc.stripe = {
            customer_id: userDoc.stripe_customer_id,
            last_four: userDoc.stripe_last_four,
            plan: userDoc.stripe_plan,
            stripe_subscription_id: userDoc.stripe_subscription_id,
          }
          async.parallel({
            preferences: function(callback) {
                var userPreferences = new Array();
                async.each(userDoc.user_preferences, function(preference, cb) {
                    let prefCollection = reference.collection('user_preferences');
                    prefCollection.where('id','==', preference).get(getOptions).then(function(querysnapshot) {
                        async.each(querysnapshot.docs, function(d, c) {
                            var prefdata = d.data();
                            prefdata.key = d.id;
                            userPreferences.push(prefdata);
                            c();
                        }, function(_e) {
                            if (_e) { 
                                console.log(_e.message);
                                cb(_e);
                            } else {
                                cb();
                            }
                        });
                    }).catch(function (error) {
                        if (error) {
                            console.log(error.message);
                            cb(error);
                        }
                    });
                }, function(e) {
                    if (e) {
                        console.error(e.message);
                        callback(e, null);
                    } else {
                        callback(null, userPreferences);
                    }
                });
            },
            account_type: function(callback) {
                var accountTypes = new Array();
                let prefCollection = reference.collection('account_roles');
                prefCollection.where('id','==', userDoc.account_type_id).get(getOptions).then(function(querysnapshot) {
                    async.each(querysnapshot.docs, function(d, c) {
                        var prefdata = d.data();
                        prefdata.key = d.id;
                        accountTypes.push(prefdata);
                        c();
                    }, function(_e) {
                        if (_e) { 
                            console.log(_e.message);
                            callback(_e, accountTypes);
                        } else {
                            callback(null, accountTypes);
                        }
                    });
                }).catch(function (error) {
                    if (error) {
                        console.log(error.message);
                        callback(error, null);
                    }
                });
            }, 
            meetings: function(callback) {
                Meetings.getAllMeetingsForUserId(
                  {
                    'userID': userDoc.uid
                  }, function(error, meetings) {
                    if (error) return callback(error, new Array());
      
                    if (!meetings) {
                      return callback(null, new Array());
                    }
                    callback(null, meetings);
                  }
                );
            }
          }, function(error, results) {
              console.log(results);
              console.log(error);

              if (error) return completionHandler(error, null);

              if (results.preferences) {
                  userDoc.preferences = results.preferences
              }

              if (results.account_type) {
                  userDoc.account_type = results.account_type
              }

              if (results.meetings) {
                  userDoc.meetings = results.meetings
              }

              users.push(userDoc);
              completion();
          });
    }, function (err) {
        if (err) return completionHandler(err, null);
        let data = {
            "uid": uid,
            "user": users
        }
        console.log(data);
        completionHandler(err, users);
    });
  }).catch(function (error) {
    if (error) {
      completionHandler(error, null);
    }
  });  
}

function saveUserObject(object, completionHandler) {
  crudHelper.add(collection, object, completionHandler);
}

function updateUserWithId(id, object, completionHandler) {
  crudHelper.update(collection, id, object, completionHandler);
}

function deleteUserWithId(id, completionHandler) {
  crudHelper.delete(collection, id, completionHandler);
}

function initWithUid(parameters, completionHandler) {
  firebase.app(function(fireApp) {
    if (!fireApp.auth && !fireApp.firestore) {
      console.log('Cannot retrieve user information due to lack of Firebase reference.');
      completionHandler({
        message: 'Something went wrong. Please try again.'
      }, null);
    }
    var reference = fireApp.firestore;
    retrieveUserBy(parameters, reference, completionHandler);
  });
}

function initWithId(parameters, completionHandler) {
  firebase.app(function(fireApp) {
    if (!fireApp.auth && !fireApp.firestore) {
      console.log('Cannot retrieve user information due to lack of Firebase reference.');
      completionHandler({
        message: 'Something went wrong. Please try again.'
      }, null);
    }
    var reference = fireApp.firestore;
    retrieveUserById(parameters, reference, completionHandler);
  });
}

function generateTokenFrom(uid, completionHandler) {
  jwt.sign({ 
    uid: uid
  },
  secrets.sessionRefresh, 
  {
    expiresIn: secrets.sessionRefreshLimit
  }, 
  completionHandler);
}

module.exports = {
  // Initialization
  initWithUid: function initWithUid(parameters, completionHandler) {
    initWithUid(parameters, completionHandler);
  },

  initWithId: function initWithId(parameters, completionHandler) {
    initWithId(parameters, completionHandler);
  },

  // Auth functionality and business logic
  loginWithEmailAndPasswordIdentity: function loginUsingEmailAndPasswordIdentity(parameters, completionHandler) {
    firebase.app(function(fireApp) {
      if (!fireApp.auth && !fireApp.firestore) return completionHandler({
        message: 'Authentication module could not be initialized'
      }, null);

      fireApp.auth.signOut().then(function() {
        fireApp.auth.signInWithEmailAndPassword(parameters.email, parameters.password).then(function(auth) {
          var currentUser = auth.user;
          console.log(auth);
          initWithUid(currentUser.uid, function(err, users) {
            if (err) return completionHandler(err, null);
            var user = users[0];
            if (!user) {
              completionHandler({
                message: 'Something went wrong. Please try again.'
              }, null);
            }
            user.refresh_token = currentUser.refreshToken
            updateUserWithId(user.key, {
              refresh_token: currentUser.refreshToken
            }, function(e) {
              if (e) return console.log('Error updating refresh token');
              console.log('Successfully updated refresh token.');
            })
            completionHandler(null, user);
          });
        }).catch(function (error) {
          if (error) {
            completionHandler(error, null);
          }
        });
      });
    });
  },

  signupUserWithEmailAndPasswordIdentity: function signupUserUsingEmailAndPasswordIdentity(parameters, completionHandler) {
    firebase.app(function(fireApp) {
      if (!fireApp.auth && !fireApp.firestore) return completionHandler({
        message: 'Authentication module could not be initialized'
      }, null);      
      
      fireApp.auth.signOut().then(function() {
        let email = parameters.email;
        let password = parameters.password;
        let full_name = parameters.full_name;
        let phone_number_string = parameters.phone_number_string;
        let identity_type = parameters.identity_type;
        let public_key_string = parameters.public_key_string;
        let private_key_encrypted_string = parameters.private_key_encrypted_string;
        
        fireApp.auth.createUserWithEmailAndPassword(email, password).then(function() {
          var currentUser = fireApp.auth.currentUser;
          
          var userObject = {
            id: randomstring.generate(25),
            email_address: currentUser.email,
            uid: currentUser.uid,
            refresh_token: currentUser.refreshToken,
            public_key_string: public_key_string,
            private_key_encrypted_string: private_key_encrypted_string,
            createdAt: new Date(),
            lastLogin: new Date(),
            first_name: null,
            full_name: full_name,
            last_name: null,
            preferred_currency: 'USD',
            initial_setup : false,
            account_type_id: 10,
            maximum_events: 3,
            address_line_1 : null,
            address_line_2 : null,
            address_line_3 : null,
            address_line_4 : null,
            address_city : null,
            address_state : null,
            address_zip_code : null,
            address_long : null,
            address_lat : null,
            address_country: null,
            address_description: null,
            bio: null,
            job_title: null,
            company_name: null,
            phone_number_country_code: null,
            phone_number_area_code: null,
            phone_number_string: phone_number_string,
            gender: null,
            dob: null,
            user_preferences: [0, 1, 2, 3],
            card_on_file: false,
            payment_info_id: new Array(),
            last_known_checkin_ids: new Array(),
            identity_types: [identity_type],
            stripe_customer_id: null,
            stripe_last_four: null,
            stripe_plan: null,
            stripe_subscription_id: null
          }
        
          saveUserObject(userObject, function(error, data) {
            if (error) return console.log(error);
            var user = data;
            if (!user) {
              return completionHandler({
                message: 'Something went wrong. Please try again.'
              }, null);
            }
            completionHandler(null, user);
          });
        }).catch(function (error) {
          if (error) {
            completionHandler(error, null);
          }
        });
      });
    });
  }, 

  updatePasswordForEmailAndPasswordIdentity: function updatePasswordForEmailAndPasswordIdentity(parameters, completionHandler) {
    firebase.app(function(fireApp) {
      if (!fireApp.auth && !fireApp.firestore) return completionHandler({
        message: 'Authentication module could not be initialized'
      }, null); 

      fireApp.auth.sendPasswordResetEmail(parameters.email).then(function() {
        completionHandler(null, true);
      }).catch(function(error) {
        completionHandler(error, false);
      });
    });
  },

  logoutUserForEmailAndPasswordIdentity: function logoutUserForEmailAndPasswordIdentity(parameters, completionHandler) {
    firebase.app(function(fireApp) {
      if (!fireApp.auth && !fireApp.firestore) return completionHandler({
        message: 'Authentication module could not be initialized'
      }, null); 

      fireApp.auth.signOut().then(function() {
        // Revoke refresh token
        fireApp.adminApp.auth().revokeRefreshTokens(parameters.uid).then(() => {
          initWithUid(parameters.uid, function(error, users) {
            var user = users[0];
            if (!user) {
              console.log('Error updating refresh token');
            }
            updateUserWithId(user.key, {
              refresh_token: null
            }, function(e) {
              if (e) return console.log('Error updating refresh token');
              console.log('Successfully updated refresh token.');
            })
          })
          return fireApp.adminApp.auth().getUser(parameters.uid);
        }).then((userRecord) => {
          return new Date(userRecord.tokensValidAfterTime).getTime() / 1000;
        }).then((timestamp) => {
          console.log('Tokens revoked at: ', timestamp);
          completionHandler(null, true);
        });
      });
    });
  },

  stripe: function retrieveStripeCustomerModels() {
    return stripeCustomer;
  },

  getData: function retrieveUserDisplayData() {
    return data[0];
  },

  update: function updateUser(completionHandler) {
    var userData = data();
    if (!userData) {
      return
    }
  },

  // STRIPE USER FUNCTIONS
  createCustomerForUser: function createStripeCustomerForUser(completionHandler) {
    var userData = data();
    if (!userData) return console.log('User does not exist to create a stripe customer for.');
    this.stripe().createCustomer(userData, function(error, customerId) {
      if (error) return completionHandler(error, null);
      // Update customer ID for user
    })
  },

  setCardForUser: function setStripeCardForUser(parameters, completionHandler) {
    var userData = data();
    if (!userData) return console.log('User does not exist to add a card to.');
    this.stripe().setCardFor(userData, parameters.stripeToken, function(error, results) {
      if (error) return completionHandler(error, null);
      // Update last four for user and retrieve optional customer ID
      console.log(results.lastFour);
      console.log(results.customerId);
    })
  },

  setPlanForUser: function setStripePlanForUser(parameters, completionHandler) {
    var userData = data();
    if (!userData) return console.log('User does not exist to set a plan for.');
    this.stripe().setPlan(userData, parameters.plan, parameters.stripeToken, function(error, results) {
      if (error) return completionHandler(error, null);
      // Update plan and subscription id for user
      console.log(results.stripePlan);
      console.log(results.subscriptionId)
    })
  },

  // Call when user updates their email in the profile
  updateEmailInStripeForUser: function updateEmailInStripeForUser(completionHandler) {
    var userData = data();
    if (!userData) return console.log('User does not exist to set a plan for.');
    this.stripe().updateEmail(userData, function(error, success) {
      if (error) return completionHandler(error, null);
      // Did we update the users email in stripe?
      console.log(success);
    })
  },

  cancelStripeSubscriptionForUser: function cancelStripeSubscriptionForUser(completionHandler) {
    var userData = data();
    if (!userData) return console.log('User does not exist to set a plan for.');
    this.stripe().cancelStripe(userData, function(error, success) {
      if (error) return completionHandler(error, null);
      // Did we update the users email in stripe?
      console.log(success);
    })
  }
}