var LocalStrategy                     = require('passport-local').Strategy;
var User                              = require('../models/user');

module.exports = function(passport){

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.initWithId(id, function(err, data) {
      done(err, data);
    });
  });

  // login
  passport.use('login', new LocalStrategy({
      usernameField: 'email',
      passReqToCallback : true
    },
    function(req, email, password, done) {  
      User.loginWithEmailAndPasswordIdentity({ 
        'email': email,
        'password': password,
      }, function(error, user) {
        if (error) return done(error);

        if(!user) {
          return done({message: 'Data for user is unavailable.'}, null, req.flash('error', 'Data for user is unavailable.'));
        }

        console.log(user);
        
        var time = 14 * 24 * 3600000;
        req.session.cookie.maxAge = time; //2 weeks
        req.session.cookie.expires = new Date(Date.now() + time);
        req.session.touch();

        return done(null, user, req.flash('success', 'Successfully logged in.'));
      });
    })
  );

  passport.use('signup', new LocalStrategy({
      usernameField: 'email',
      passReqToCallback : true
    },
    function(req, email, password, done) {
      var findOrCreateUser = function() {

        var registeredUser = User.signupUserWithEmailAndPasswordIdentity({
          email: req.body.email,
          password: req.body.password,
          full_name: req.body.full_name,
          phone_number_string: req.body.phone_number_string,
        }, function(e, model) {
          if (e) {
            req.flash('form', {
              email: req.body.email
            });
            return done(null, false, req.flash('error', error.message));
          }

          var user = model.getData();

          if(!user) {
            return done(null, false, req.flash('error', 'Data for user is unavailable.'));
          }

          var time = 14 * 24 * 3600000;
          req.session.cookie.maxAge = time; //2 weeks
          req.session.cookie.expires = new Date(Date.now() + time);
          req.session.touch();

          return done(null, user, req.flash('success', 'Thanks for signing up!!'));
      
        });
      };

      process.nextTick(findOrCreateUser);

    })
  );

};
