'use strict';

// This controller handles setting/clearing sessions when
// logging in and out.

var passport                          = require('passport');
var User                              = require('../models/user');

exports.postLogin = function(req, res, next){
  req.assert('email', 'Please sign up with a valid email.').isEmail();
  req.assert('password', 'Password must be at least 6 characters long').len(6);

  var errors = req.validationErrors();
  if (errors) {
    req.flash('errors', errors);
    return res.redirect(req.redirect.failure);
  }
  // this middleware can be found in /server/middleware/passport.js
  // re: passport.use('login', ...);
  passport.authenticate('login', {
    successRedirect: req.redirect.success,
    failureRedirect: req.redirect.failure,
    failureFlash : true
  })(req, res, next);
};

exports.logout = function(req, res){
  var time = 60 * 1000;

  req.logout();
  req.session.cookie.maxAge = time;
  req.session.cookie.expires = new Date(Date.now() + time);
  req.session.touch();
  req.flash('success','Successfully logged out.');
  res.redirect(req.redirect.success);
};

// Abstraction for api endpoints
exports.handleAction = function(req, res, next) {
  console.log(req.body);
  let action = req.body.action;
  if (action == 'email_registration') {
      var params = {
        email: req.body.email,
        password: req.body.password,
        full_name: req.body.full_name,
        phone_number_string: req.body.phone_number_string,
        public_key_string: req.body.public_key_string || null,
        private_key_encrypted_string: req.body.private_key_encrypted_string || null,
        identity_type: 'login'
      }

      if (!params.email || !params.password || !params.full_name || !params.phone_number_string) return res.status(200).json({
          status: 200,
          success: false,
          data: null,
          error_message: "1 or more parameters are missing. Please try again.",
          redirect_url: '/'  
      });

      User.signupUserWithEmailAndPasswordIdentity(params, function(error, user) {
        if (error) return res.status(200).json({
            status: 200,
            success: false,
            data: null,
            error_message: error.message,
            redirect_url: '/'  
        });

        if (!user) {
            return res.status(200).json({
                status: 200,
                success: false,
                data: null,
                error_message: 'Something went wrong. Please try again.',
                redirect_url: '/'  
            });
        }

        return res.status(200).json({
            status: 200,
            success: true,
            data: {
              user: user
            },
            error_message: null,
            redirect_url: '/users/' + user.uid  
        });
      });
  }

  if (action == 'email_login') {
    User.loginWithEmailAndPasswordIdentity({ 
        email: req.body.email,
        password: req.body.password,
      }, function(error, user) {
        if (error) return res.status(200).json({
            status: 200,
            success: false,
            data: null,
            error_message: error.message,
            redirect_url: '/'  
        });

        if (!user) {
            return res.status(200).json({
                status: 200,
                success: false,
                data: null,
                error_message: 'Email or password are invalid. Please try again.',
                redirect_url: '/'  
            });
        }

        return res.status(200).json({
            status: 200,
            success: true,
            data: {
              user: user
            },
            error_message: null,
            redirect_url: '/users/' + user.uid  
        });
    });
  }

  if (action == 'forgot_password') {
      var params = {
        email: req.body.email,
      }

      if (!params.email) return res.status(200).json({
          "status": 200,
          "success": false,
          "data": null,
          "error_message": "Email or password are invalid. Please try again."
      });

      User.updatePasswordForEmailAndPasswordIdentity(params, function(error, success) {
        if (error) return res.status(200).json({
            status: 200,
            success: false,
            data: null,
            error_message: error.message,
            redirect_url: '/'  
        });

        if (!success) {
            return res.status(200).json({
                status: 200,
                success: false,
                data: null,
                error_message: 'Something went wrong. Please try again.',
                redirect_url: '/'  
            });
        }

        return res.status(200).json({
            status: 200,
            success: true,
            data: null,
            error_message: null,
            redirect_url: '/login' 
        });
    });
  }

  if (action == 'log_out') {
      var params = {
        uid: req.body.uid,
      }

      if (!params.uid) return res.status(200).json({
        "status": 200,
        "success": false,
        "data": null,
        "error_message": "Something went wrong. Please try again."
        });

      User.logoutUserForEmailAndPasswordIdentity(params, function(error, success) {
        if (error) return res.status(200).json({
            status: 200,
            success: false,
            data: null,
            error_message: error.message,
            redirect_url: '/'  
        });

        if (!success) {
            return res.status(200).json({
                status: 200,
                success: false,
                data: null,
                error_message: 'Something went wrong. Please try again.',
                redirect_url: '/'  
            });
        }

        return res.status(200).json({
            status: 200,
            success: true,
            data: null,
            error_message: null,
            redirect_url: '/login' 
        });
    });
  }
}