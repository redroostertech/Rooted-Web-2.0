'use strict';

var User = require('../models/user'),
plans = User.stripe().getPlans();

exports.getHome = function(req, res, next){
  var form = {},
  error = null,
  formFlash = req.flash('form'),
  errorFlash = req.flash('error');

  if (formFlash.length) {
    form.email = formFlash[0].email;
  }

  if (errorFlash.length) {
    error = errorFlash[0];
  }
  
  res.render(req.render, {
    form: form, 
    error: error, 
    plans: plans
  });
};

// Abstraction for api endpoints
exports.handleAction = function(req, res, next) {
  console.log(req.body);
  let action = req.body.action;

  if (action == 'update_user') { }

  if (action == 'retrieve_user_for_id') { }

  if (action == 'save_meeting')  { }

  if (action == 'retrieve_upcoming_meetings_for_user') { }

  if (action == 'retrieve_sent_meetings_for_user') { }

  if (action == 'retrieve_meeting_for_id') { }

  if (action == 'accept_meeting') { }

  if (action == 'decline_meeting') { }

  if (action == 'update_meeting') { }

  if (action == 'cancel_meeting') { }

  if (action == 'delete_meeting') { }

  if (action == 'create_workspace') { }

  if (action == 'send_activity') { }

  if (action == 'get_activity_for_object') { }

      // Drafts
  if (action == 'retrieve_meeting_drafts_for_user') { }

  if (action == 'save_draft') { }

  if (action == 'update_draft') { }

  if (action == 'delete_draft') { }

  // Zoom
  if (action == 'createMeeting') { }

  if (action == 'createUser') { }
}