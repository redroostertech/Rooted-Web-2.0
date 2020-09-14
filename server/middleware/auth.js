'use strict';

var firebase                          = require('../../firebase');

exports.isAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()){
    return next();
  }
  res.redirect(req.redirect.auth);
};

exports.isUnauthenticated = function(req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect(req.redirect.auth);
};

exports.isAuthenticatedApiRequest = function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(200).json({
    status: 200,
    success: false,
    data: null,
    error_message: 'Please login or signup to access API.', 
    redirect_url: '/'  
  });
};

exports.isUnauthenticatedApiRequest = function(req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  }
  return res.status(200).json({
    status: 200,
    success: false,
    data: null,
    error_message: 'Please login or signup to access API.', 
    redirect_url: '/'  
  });
};

exports.isTokenValidated = function(req, res, next) {
  console.log(req.body);
  firebase.app(function(fireApp) {
    if (!fireApp.auth) return res.status(200).json({
      status: 200,
      success: false,
      data: null,
      error_message: 'Something went wrong. Please try again.', 
      redirect_url: '/'  
    });

    if (!req.body.idToken) return res.status(200).json({
      status: 200,
      success: false,
      data: null,
      error_message: 'Please login or signup to access API.', 
      redirect_url: '/'  
    }); 
    
    fireApp.adminApp.auth().verifyIdToken(req.body.idToken, true).then(function(decodedToken) {
      let uid = decodedToken.uid;
      return next();
    }).catch(function(error) {
        // Token is invalid.
        return res.status(200).json({
          status: 200,
          success: false,
          data: null,
          error_message: error.message, 
          redirect_url: '/'  
        });
    });
  });
}