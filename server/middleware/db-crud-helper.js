var firebase                          = require('../../firebase');

const genericError = {
    'code': 500,
    'message': 'There was a server error.'
}

module.exports = {
    add: function addDataTo(collection, data, completionHandler) {
        firebase.app(function(fireApp) {
            if (!fireApp.auth && !fireApp.firestore) {
                completionHandler(genericError, data);
                return;
            }
            var reference = fireApp.firestore;
            let refCollection = reference.collection(collection);
            refCollection.add(data).then(function(docRef) {
                console.log("Document written with ID: ", docRef.id);
                data.key = docRef.id;
                completionHandler(null, data);
            }).catch(function (error) {
                completionHandler(error, null);
            });
        })
    },

    update: function updateDataIn(collection, key, data, completionHandler) {
        firebase.app(function(fireApp) {
            if (!fireApp.auth && !fireApp.firestore) {
                completionHandler(genericError, data);
                return;
            }
            var reference = fireApp.firestore;
            let refCollection = reference.collection(collection);
            refCollection.doc(key).set(data, { merge: true }).then(function() {
                completionHandler(null);
            }).catch(function (error) {
                completionHandler(error);
            });
        });
    },

    delete: function deleteDataIn(collection, key, completionHandler) {
        firebase.app(function(fireApp) {
            if (!fireApp.auth && !fireApp.firestore) {
                completionHandler(genericError, data);
                return;
            }
            var reference = fireApp.firestore;
            let refCollection = reference.collection(collection);
            refCollection.doc(key).delete().then(function() {
                completionHandler(null);
            }).catch(function (error) {
                completionHandler(error);
            });
        });
    }
}