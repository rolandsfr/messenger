const functions = require("firebase-functions");
const algoliasearch = require("algoliasearch");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();

const APP_ID = functions.config().algolia.app;
const ADMIN_KEY = functions.config().algolia.key;

const client = algoliasearch(APP_ID, ADMIN_KEY);
const index = client.initIndex("users");

exports.addToIndex = functions.firestore
  .document("users/{uid}")
  .onCreate((snapshot) => {
    const data = snapshot.data();
    const objectID = snapshot.id;

    const algoliaData = {
      name: data.name,
      email: data.email,
    };

    return index.saveObject({ ...algoliaData, objectID });
  });

exports.updateIndex = functions.firestore
  .document("users/{uid}")
  .onUpdate((snapshot) => {
    const dataAfterChange = snapshot.after.data();
    const objectID = snapshot.after.id;

    const algoliaData = {
      name: dataAfterChange.name,
      email: dataAfterChange.email,
    };

    return index.saveObject({ ...algoliaData, objectID });
  });

exports.deleteFromIndex = functions.firestore
  .document("users/{uid}")
  .onDelete(async (snapshot) => {
    await index.deleteObject(snapshot.id);
    await admin.auth().deleteUser(snapshot.id);
  });

exports.addExistingDataToIndex = functions.https.onRequest(async (req, res) => {
  let users = await db.collection("users").get();
  users.forEach((doc) => {
    const objectID = doc.id;
    const algoliaData = {
      name: doc.data().name,
      email: doc.data().email,
    };

    index.saveObject({ ...algoliaData, objectID });
  });

  return null;
});
