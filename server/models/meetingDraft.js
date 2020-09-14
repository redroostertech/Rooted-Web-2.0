var secrets                           = require('../config/secrets');
var firebase                          = require('../../firebase');
var async                             = require('async');
var randomstring                      = require('randomstring');
var User                              = require('./user');
var moment                            = require('moment');
var crudHelper                        = require('../middleware/db-crud-helper');

var getOptions = { 
  source: 'cache' 
};

const collection = 'draft_meetings';

function retrieveMeetingsCreatedByUserId(uid, optionalStartDate, optionalEndDate, reference, completionHandler) {
    console.log("The day before: " + optionalStartDate);
    console.log("The Day After: " + optionalEndDate);

    let refCollection = reference.collection(collection);
    refCollection.where('owner_id','==', uid)
    if (optionalEndDate || optionalStartDate) {
        refCollection.where("meeting_date.start_date", ">", optionalStartDate).where("meeting_date.start_date", "<=", optionalEndDate)
    }
    refCollection.get(getOptions).then(function(querySnapshot) {
        var meetings = new Array();

        async.each(querySnapshot.docs, function(doc, completion) {
            var meetingDoc = doc.data();
            meetingDoc.key = doc.id;

            // Get the additional information for user
            async.parallel({
                owner: function(cback) {
                    var owner = new Array();
                    let prefCollection = reference.collection('users');
                    prefCollection.where('uid','==', meetingDoc.owner_id).get(getOptions).then(function(querysnapshot) {
                        async.each(querysnapshot.docs, function(d, c) {
                            var prefdata = d.data();
                            prefdata.key = d.id;
                            owner.push(prefdata);
                            c();
                        }, function(_e) {
                            if (_e) { 
                                console.log(_e.message);
                                cback(_e, owner);
                            } else {
                                cback(null, owner);
                            }
                        });
                    }).catch(function (error) {
                        if (error) {
                            console.log(error.message);
                            cback(error, null);
                        }
                    });
                }
            }, function(error, results) {
                console.log(results);
                console.log(error);

                if (error) return callback(error, null);

                if (results.owner) {
                    meetingDoc.owner = results.owner
                }

                meetings.push(meetingDoc);
                completion();
            });
        }, function (err) {
            if (err) return completionHandler(err, null);       
            completionHandler(err, meetings);
        });
    }).catch(function (error) {
        completionHandler(err, null);
    });
}

function retrieveMeetingWithId(meetingId, reference, completionHandler) {
    let refCollection = reference.collection(collection);
    refCollection.where('id','==', meetingId).get(getOptions).then(function(querySnapshot) {
        var meetings = new Array();
        async.forEach(querySnapshot.docs, function(doc, key, completion) {
            var meetingDoc = doc.data();
            meetingDoc.key = doc.id;
            meetings.push(meetingDoc);
            completion();
        }, function (err) {
            if (err) return completionHandler(err, null);            
            completionHandler(err, meetings);
        });
    }).catch(function (error) {
        completionHandler(err, null);
    }); 
}

function saveMeeting(object, completionHandler) {
    crudHelper.add(collection, object, completionHandler);
}

function updateMeetingWithId(id, object, completionHandler) {
    crudHelper.update(collection, id, object, completionHandler);
}

function deleteMeetingWithId(id, completionHandler) {
    crudHelper.delete(collection, id, completionHandler);
}

module.exports = {
  getMeetingsCreatedByUserId: function getMeetingsCreatedByUserId(parameters, completionHandler) {
    firebase.app(function(fireApp) {
        if (!fireApp.auth && !fireApp.firestore) {
            console.log('Cannot retrieve meeting information due to lack of Firebase reference.');
            return;
        }
        var reference = fireApp.firestore;

        var startDate; 
        if (parameters.date) {
            startDate = moment(parameters.date).subtract(1, 'days').format();
        }

        var endDate;
        if (parameters.endDate) {
            endDate = moment(parameters.endDate).add(1, 'days').format();
        }

        retrieveMeetingsCreatedByUserId(parameters.userID, startDate, endDate, reference, completionHandler);
         
    });
  }, 

  getMeetingWithId: function getMeetingWithId(parameters, completionHandler) {
    firebase.app(function(fireApp) {
        if (!fireApp.auth && !fireApp.firestore) {
            console.log('Cannot retrieve meeting information due to lack of Firebase reference.');
            return;
        }
        var reference = fireApp.firestore;
        retrieveMeetingWithId(parameters.meetingId, reference, completionHandler);
    });
  },

  create: function createNewFrom(parameters, completionHandler) {
      saveMeeting(parameters.data, completionHandler)
  },

  // User Actions
  updateMeetingForId: function updateMeetingForId(parameters, completionHandler) {
    firebase.app(function(fireApp) {
        if (!fireApp.auth && !fireApp.firestore) {
            console.log('Cannot retrieve meeting information due to lack of Firebase reference.');
            return;
        }
        var reference = fireApp.firestore;
        retrieveMeetingWithId(parameters.meetingId, reference, function(e, data) {
            if (e) return callback(e, null);
            var meetings = data;
            var meeting = meetings[0];
            if (!meeting) return completionHandler({
                'message': 'Data for user is unavailable.'
            }, null);

            if (meeting.user_id !== parameters.owner_id) return completionHandler({
                'message': 'You do not have the permission to update this meeting.'
            }, null);

            let updateData = JSON.parse(parameters.data);
            console.log("Update data");
            console.log(updateData);
            Object.keys(updateData).forEach(function(key) {
                meeting[key] = updateData[key];
            });
            updateMeetingWithId(meeting.key, meeting, completionHandler);
        });
    });
  }, 

  deleteMeetingForId: function deleteMeetingForId(parameters, completionHandler) {
    firebase.app(function(fireApp) {
        if (!fireApp.auth && !fireApp.firestore) {
            console.log('Cannot retrieve meeting information due to lack of Firebase reference.');
            return;
        }
        var reference = fireApp.firestore;
        retrieveMeetingWithId(parameters.meetingId, reference, function(e, data) {
            if (e) return callback(e, null);
            var meetings = data;
            var meeting = meetings[0];
            if (!meeting) return completionHandler({
                'message': 'Data for user is unavailable.'
            }, null);

            if (meeting.user_id !== parameters.owner_id) return completionHandler({
                'message': 'You do not have the permission to delete this meeting.'
            }, null);

            deleteMeetingWithId(meeting.key, completionHandler);
        });
    });
  }
}