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

const collection = 'meetings';

function getOwnerAndAllParticipantsFor(meeting, completionHandler) {
    async.parallel({
        owner: function(callback) {
            var owner = new Array();
            User.initWithUid({
                'uid': meeting.owner_id
            }, function(error, users) {
                if (error) return callback(error);
                var userDoc = users[0];
                if (!userDoc) {
                    return callback({
                        message: 'User data is unavailable'
                    });
                }
                owner.push(userDoc);
                callback(null, owner);
            });
        },        
        participants: function(callback) {
            var participants = new Array();
            async.each(meeting.meeting_participants_ids, function(participantId, completion) {
                User.initWithUid({
                    'uid': participantId
                }, function(error, users) {
                    if (error) return callback(error);
                    var userDoc = users[0];
                    if (!userDoc) {
                        return callback({
                            message: 'User data is unavailable'
                        });
                    }
                    participants.push(userDoc);
                    completion();
                });
            }, function (err) {
                if (err) return callback(err, null);
                let data = {
                    "uid": uid,
                    "user": users
                }
                console.log(participants);
                callback(null, participants);
            });
        },
        declined_participants: function(callback) {
            var participants = new Array();
            async.each(meeting.decline_meeting_participants_ids, function(participantId, completion) {
                User.initWithUid({
                    'uid': participantId
                }, function(error, users) {
                    if (error) return callback(error);
                    var userDoc = users[0];
                    if (!userDoc) {
                        return callback({
                            message: 'User data is unavailable'
                        });
                    }
                    participants.push(userDoc);
                    completion();
                });
            }, function (err) {
                if (err) return callback(err, null);
                console.log(participants);
                callback(null, participants);
            });
        },
    }, completionHandler);
}

function retrieveAllMeetingsForUserId(uid, optionalStartDate, optionalEndDate, reference, completionHandler) {
// Get the original user data
    // Get the additional information for user
    console.log("The day before: " + optionalStartDate);
    console.log("The Day After: " + optionalEndDate);

    async.parallel({
        other_meetings: function(callback) {
            let refCollection = reference.collection(collection);
            refCollection.where('meeting_participants_ids','array-contains', uid).where("meeting_date.start_date", ">", optionalStartDate).where("meeting_date.start_date", "<=", optionalEndDate).get(getOptions).then(function(querySnapshot) {
                var users = new Array();
                async.each(querySnapshot.docs, function(doc, completion) {
                    var userDoc = doc.data();
                    userDoc.key = doc.id;
                    getOwnerAndAllParticipantsFor(userDoc, function(error, results) {
                        console.log(results);
                        console.log(error);

                        if (error) return console.log(error);

                        if (results.owner) {
                            userDoc.owner = results.owner
                        }

                        if (results.participants) {
                            userDoc.participants = results.participants;
                        }

                        if (results.declined_participants) {
                            userDoc.declined_participants = results.declined_participants;
                        }

                        users.push(userDoc);
                        completion();
                    });
                }, function (err) {
                    if (err) return callback(err);
                    callback(err, users);
                });
            }).catch(function (error) {
                if (error) {
                    console.log(error);
                    callback(error, null);
                }
            });  
        },

        my_meetings: function(callback) {
            let refCollection = reference.collection(collection);
            refCollection.where('owner_id','==', uid).where("meeting_date.start_date", ">", optionalStartDate).where("meeting_date.start_date", "<=", optionalEndDate).get(getOptions).then(function(querySnapshot) {
                var users = new Array();

                async.each(querySnapshot.docs, function(doc, completion) {
                    var userDoc = doc.data();
                    userDoc.key = doc.id;

                    getOwnerAndAllParticipantsFor(userDoc, function(error, results) {
                        console.log(results);
                        console.log(error);

                        if (error) return console.log(error);

                        if (results.owner) {
                            userDoc.owner = results.owner
                        }

                        if (results.participants) {
                            userDoc.participants = results.participants;
                        }

                        if (results.declined_participants) {
                            userDoc.declined_participants = results.declined_participants;
                        }

                        users.push(userDoc);
                        completion();
                    });
                }, function (err) {
                    if (err) return callback(err, null);
                    callback(err, users);
                });
            }).catch(function (error) {
                if (error) {
                    console.log(error.message);
                    callback(error, null);
                }
            });  
        }
    }, function(err, results) {
        if (err) return completionHandler(err, null);

        var meetingIds = new Array();
        var meetings = new Array();

        if (results.my_meetings) {
            results.my_meetings.forEach(function(meeting) {
                if (!meetingIds.includes(meeting.id)) {
                    meetings.push(meeting);
                    meetingIds.push(meeting.id);
                }
            });
        }

        if (results.other_meetings) {
            results.other_meetings.forEach(function(meeting) {
                if (!meetingIds.includes(meeting.id)) {
                    meetings.push(meeting);
                    meetingIds.push(meeting.id);
                }
            });
        }
        console.log('Meetings');
        console.log(meetings);
        completionHandler(err, meetings);
    });
}

function retrieveMeetingWithId(meetingId, reference, completionHandler) {
    // Get the original user data
    // Get the additional information for user
    console.log("The day before: " + optionalStartDate);
    console.log("The Day After: " + optionalEndDate);

    let refCollection = reference.collection(collection);
    refCollection.where('id','==', meetingId).get(getOptions).then(function(querySnapshot) {
        var meetings = new Array();

        async.each(querySnapshot.docs, function(doc, completion) {
            var meetingDoc = doc.data();
            meetingDoc.key = doc.id;

            // Get the additional information for user
            getOwnerAndAllParticipantsFor(userDoc, function(error, results) {
                console.log(results);
                console.log(error);

                if (error) return console.log(error);

                if (results.owner) {
                    meetingDoc.owner = results.owner
                }

                if (results.participants) {
                    meetingDoc.participants = results.participants;
                }

                if (results.declined_participants) {
                    meetingDoc.declined_participants = results.declined_participants;
                }

                meetings.push(meetingDoc);
                completion();
            });
        }, function (err) {
            if (err) return callback(err, null);
            completionHandler(err, meetings);
        })
    }).catch(function (error) {
        if (error) {
            completionHandler(error, null);
        }
    }); 
}

function retrieveMeetingsCreatedByUserId(uid, optionalStartDate, optionalEndDate, reference, completionHandler) {
    // Get the original user data
    // Get the additional information for user
    console.log("The day before: " + optionalStartDate);
    console.log("The Day After: " + optionalEndDate);

    let refCollection = reference.collection(collection);
    refCollection.where('owner_id','==', uid).where("meeting_date.start_date", ">", optionalStartDate).where("meeting_date.start_date", "<=", optionalEndDate).get(getOptions).then(function(querySnapshot) {
        var meetings = new Array();

        async.each(querySnapshot.docs, function(doc, completion) {
            var meetingDoc = doc.data();
            meetingDoc.key = doc.id;

            // Get the additional information for user
            getOwnerAndAllParticipantsFor(userDoc, function(error, results) {
                console.log(results);
                console.log(error);

                if (error) return console.log(error);

                if (results.owner) {
                    meetingDoc.owner = results.owner
                }

                if (results.participants) {
                    meetingDoc.participants = results.participants;
                }

                if (results.declined_participants) {
                    meetingDoc.declined_participants = results.declined_participants;
                }

                meetings.push(meetingDoc);
                completion();
            });
        }, function (err) {
            if (err) return callback(err, null);
            completionHandler(err, meetings);
        })
    }).catch(function (error) {
        if (error) {
            completionHandler(error, null);
        }
    }); 
}

function saveMeeting(object, completionHandler) {
  crudHelper.add(collection, object, completionHandler);
}

function acceptMeetingWithIdForUserId(meetingId, userId, reference, completionHandler) {
    let refCollection = reference.collection(collection);
    refCollection.where('id', '==', meetingId).get(getOptions).then(function(querySnapshot) {
        async.each(querySnapshot.docs, function(doc, completion) {
            var object = new Object();

            var meetingParticipantsId = doc.data().meeting_participants_ids;
            console.log(typeof meetingParticipantsId !== 'undefined');
            if (typeof meetingParticipantsId !== 'undefined') {
                if (!meetingParticipantsId.includes(userId)) {
                    meetingParticipantsId.push(userId);
                    object['meeting_participants_ids'] = meetingParticipantsId;
                }
            } else {
                meetingParticipantsId = new Array(userId);
                object['meeting_participants_ids'] = meetingParticipantsId;
            } 

            var declinedMeetingPaticipantsIds = doc.data().decline_meeting_participants_ids;
            console.log(typeof declinedMeetingPaticipantsIds !== 'undefined');
            if (typeof declinedMeetingPaticipantsIds !== 'undefined') {
                object['decline_meeting_participants_ids'] = declinedMeetingPaticipantsIds.filter(function(participantId) {
                    return participantId !== userId
                });
            }
            
            updateMeetingWithId(doc.id, object, function(error) {
                if (error) return completionHandler(error, null);
                completion();
            });

        }, function (err) {
            if (err) return completionHandler(err, null);
            retrieveMeetingWithId(id, reference, completionHandler);
        });
    }).catch(function (error) {
        if (error) {
            completionHandler(error, null);
        }
    });
}

function declineMeetingWithIdForUserId(meetingId, userId, reference, completionHandler) {
    let refCollection = reference.collection(collection);
    refCollection.where('id', '==', meetingId).get(getOptions).then(function(querySnapshot) {
        async.each(querySnapshot.docs, function(doc, completion) {
            var object = new Object();

            var meetingParticipantsId = doc.data().meeting_participants_ids;
            console.log(typeof meetingParticipantsId !== 'undefined');
            if (typeof meetingParticipantsId !== 'undefined') {
                object['meeting_participants_ids'] = doc.data().meeting_participants_ids.filter(function(participantId) {
                    return participantId !== userId
                });
            }

            var declinedMeetingPaticipantsIds = doc.data().decline_meeting_participants_ids;
            console.log(typeof declinedMeetingPaticipantsIds !== 'undefined');
            if (typeof declinedMeetingPaticipantsIds !== 'undefined') {
                if (!declinedMeetingPaticipantsIds.includes(userId)) {
                    // declinedMeetingPaticipantsIds = new Array();
                    declinedMeetingPaticipantsIds.push(userId);
                    object['decline_meeting_participants_ids'] = declinedMeetingPaticipantsIds;
                }
            } else {
                // declinedMeetingPaticipantsIds = new Array();
                declinedMeetingPaticipantsIds = new Array(userId);
                object['decline_meeting_participants_ids'] = declinedMeetingPaticipantsIds;
            } 

            updateMeetingWithId(doc.id, object, function(error) {
                if (error) return completionHandler(error, null);
                completion();
            });
        }, function (err) {
            if (err) return completionHandler(err, null);
            retrieveMeetingWithId(id, reference, completionHandler);
        });
    }).catch(function (error) {
        if (error) {
            completionHandler(error, null);
        }
    });
}

function updateMeetingWithId(id, object, completionHandler) {
    crudHelper.update(collection, id, object, completionHandler);
}

function deleteMeetingWithId(id, completionHandler) {
    crudHelper.delete(collection, id, completionHandler);
}

module.exports = {
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

  getMeetingsForUserForDateRange: function getMeetingsForUserForDateRange(parameters, completionHandler) {
    firebase.app(function(fireApp) {
        if (!fireApp.auth && !fireApp.firestore) {
            console.log('Cannot retrieve meeting information due to lack of Firebase reference.');
            return;
        }
        var reference = fireApp.firestore;

        var startDate; 
        if (!parameters.date) {
            startDate = moment().subtract(1, 'days').format();
        } else {
            startDate = moment(parameters.date).subtract(1, 'days').format();
        }

        var endDate;
        if (!parameters.endDate) {
            endDate = moment().add(1, 'days').format();
        } else {
            endDate = moment(parameters.endDate).add(1, 'days').format();
        }
        retrieveAllMeetingsForUserId(parameters.userID, startDate, endDate, reference, completionHandler);
    });
  },

  getAllMeetingsForUserId: function getAllMeetingsForUserId(parameters, completionHandler) {
    firebase.app(function(fireApp) {
        if (!fireApp.auth && !fireApp.firestore) {
            console.log('Cannot retrieve meeting information due to lack of Firebase reference.');
            return;
        }
        var reference = fireApp.firestore;

        var startDate; 
        if (!parameters.date) {
            startDate = moment().subtract(1, 'days').format();
        } else {
            startDate = moment(parameters.date).subtract(1, 'days').format();
        }

        var endDate;
        if (!parameters.endDate) {
            endDate = moment().add(1, 'days').format();
        } else {
            endDate = moment(parameters.endDate).add(1, 'days').format();
        }

        retrieveAllMeetingsForUserId(parameters.userID, startDate, endDate, reference, completionHandler);
    });
  },

  getMeetingsCreatedByUserId: function getMeetingsCreatedByUserId(parameters, completionHandler) {
    firebase.app(function(fireApp) {
        if (!fireApp.auth && !fireApp.firestore) {
            console.log('Cannot retrieve meeting information due to lack of Firebase reference.');
            return;
        }
        var reference = fireApp.firestore;

        var startDate; 
        if (!parameters.date) {
            startDate = moment().subtract(1, 'days').format();
        } else {
            startDate = moment(parameters.date).subtract(1, 'days').format();
        }

        var endDate;
        if (!parameters.endDate) {
            endDate = moment().add(1, 'days').format();
        } else {
            endDate = moment(parameters.endDate).add(1, 'days').format();
        }

        retrieveMeetingsCreatedByUserId(parameters.userID, startDate, endDate, reference, completionHandler);
         
    });
  }, 

  create: function createNewFrom(parameters, completionHandler) {
    saveMeeting(parameters.data, completionHandler);
  },

  // User Actions
  acceptMeetingForIdForUserId: function acceptMeetingForIdForUserId(parameters, completionHandler) {
    firebase.app(function(fireApp) {
        if (!fireApp.auth && !fireApp.firestore) {
          console.log('Cannot retrieve user information due to lack of Firebase reference.');
          return;
        }
        var reference = fireApp.firestore;
        acceptMeetingWithIdForUserId(parameters.meeting_id, parameters.user_id, reference, completionHandler);
    });
  },

  declineMeetingForIdForUserId: function declineMeetingForIdForUserId(parameters, completionHandler) {
    firebase.app(function(fireApp) {
        if (!fireApp.auth && !fireApp.firestore) {
          console.log('Cannot retrieve user information due to lack of Firebase reference.');
          return;
        }
        var reference = fireApp.firestore;
        declineMeetingWithIdForUserId(parameters.meeting_id, parameters.user_id, reference, completionHandler);
    });
  },

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

  cancelMeetingForId: function cancelMeetingForId(parameters, completionHandler) {
    retrieveMeetingWithId(parameters.meetingId, reference, function(e, data) {
        if (e) return callback(e, null);
        if (e) return callback(e, null);
        var meetings = data;
        var meeting = meetings[0];
        if (!meeting) return completionHandler({
            'message': 'Data for user is unavailable.'
        }, null);

        if (meeting.user_id !== parameters.owner_id) return completionHandler({
            'message': 'You do not have the permission to cancel this meeting.'
        }, null);

        meeting['meeting_status_id'] = 1;

        updateMeetingWithId(meeting.key, meeting, completionHandler);
    });
     
  },

  deleteMeetingForId: function deleteMeetingForId(parameters, completionHandler) {
    retrieveMeetingWithId(parameters.meetingId, reference, function(e, data) {
        if (e) return callback(e, null);
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
     
  }
}