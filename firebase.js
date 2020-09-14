'use strict';

var firebase                = require('firebase');
var admin                   = require('firebase-admin');
var secrets                 = require('./server/config/secrets');
var FCM                     = require('fcm-node');
const { Storage }           = require('@google-cloud/storage');
const { GeoCollectionReference, GeoFirestore, GeoQuery, GeoQuerySnapshot } = require('geofirestore');
const async                 = require('async');

require("firebase/auth");
require("firebase/database");
require("firebase/messaging");
require("firebase/functions");
require("firebase/storage");
require("firebase/firestore");

//  MARK:- Setup Firebase App

var serviceAccount = require(secrets.firebase.storeFilename);  //  MARK:- Uncomment and provide url to service account .json file.
var settings = { timestampsInSnapshots: true };

var firebase_configuration = {
    apiKey: secrets.firebase.apiKey,
    authDomain: secrets.firebase.authDomain,
    databaseURL: secrets.firebase.databaseURL,
    projectId: secrets.firebase.projectID,
    storageBucket: secrets.firebase.storageBucket,
    messagingSenderId: secrets.firebase.messengingSenderID,
};

var firebaseObj, 
firebaseAdmin, 
firebaseRealtimDB,
firebaseFirestoreDB,
firbaseStorage,
firebaseGeo,
fcm,
auth;

module.exports = {
    init: function setup(callback) {
        console.log('Setting up Firebase');
        if (!firebase.apps.length) {
            firebaseObj = firebase.initializeApp(firebase_configuration);
        } else {
            firebaseObj = firebase.app();
        }
        console.log('Completed setting up base firebase app');

        firebaseAdmin = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: secrets.firebase.databaseURL,
            storageBucket: secrets.firebase.storageBucket
        });
        console.log('Completed setting up base firebase admin app');

        firebaseRealtimDB = firebase.database();
        console.log('Completed setting up base realtime db');
              
        firebaseFirestoreDB = admin.firestore();
        firebaseFirestoreDB.settings(settings);
        console.log('Completed setting up base firebase firestore db');

        firbaseStorage = new Storage({
            projectId: secrets.firebase.projectID,
            keyFilename: secrets.firebase.storeFilename
        });

        firebaseGeo = new GeoFirestore(firebaseFirestoreDB);
        console.log('Completed setting up base geoFire object');

        fcm = new FCM(serviceAccount);
        console.log('Completed setting up FCM object');
              
        auth = firebaseObj.auth();

        var results = {
            mainApp: firebaseObj,
            adminApp: firebaseAdmin,
            realtime: firebaseRealtimDB,
            firestore: firebaseFirestoreDB,
            storage: firbaseStorage,
            geo: firebaseGeo,
            fcm: fcm,
            auth: auth,
        }

        callback(results);
    },

    app: function returnFirebaseApp(callback) {
        var results = {
            mainApp: firebaseObj,
            adminApp: firebaseAdmin,
            realtime: firebaseRealtimDB,
            firestore: firebaseFirestoreDB,
            storage: firbaseStorage,
            geo: firebaseGeo,
            fcm: fcm,
            auth: auth,
        }
        callback(results);
    },

    mainApp: function returnFirebaseMainObject(callback) {
        this.shared(function(firApp) {
            callback(firApp.mainApp);
        });
    },

    adminApp: function setupAdminFirebaseApp(callback) {
        this.shared(function(firApp) {
            callback(firApp.adminApp);
        });
    },

    realtime: function setupAdminFirebaseApp(callback) {
        this.shared(function(firApp) {
            callback(firApp.realtime);
        });
    },

    firestore: function setupAdminFirebaseApp(callback) {
        this.shared(function(firApp) {
            callback(firApp.firestore);
        });
    },

    storage: function setupAdminFirebaseApp(callback) {
        this.shared(function(firApp) {
            callback(firApp.storage);
        });
    },

    geo: function setupAdminFirebaseApp(callback) {
        this.shared(function(firApp) {
            callback(firApp.geo);
        });
    },

    fcm: function setupAdminFirebaseApp(callback) {
        this.shared(function(firApp) {
            callback(firApp.fcm);
        });
    },

    auth: function setupAuth(callback) {
        this.shared(function(firApp) {
            callback(firApp.auth);
        });
    },
    
    generateGeoPoint: function generateGeopoint(lat, long, callback) {
        const point = new admin.firestore.GeoPoint(lat, long);
        callback({
            g: geohash.encode(lat, long, 10),
            l: point
        });
    }
}