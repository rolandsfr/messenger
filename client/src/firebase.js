import firebase from "firebase/app";
import "firebase/firestore";

var firebaseConfig = {
  apiKey: "AIzaSyDKWlW4Y5iIgPOnKFM75P4LvLtClaiWX84",
  authDomain: "messanger-77259.firebaseapp.com",
  projectId: "messanger-77259",
  storageBucket: "messanger-77259.appspot.com",
  messagingSenderId: "410398666813",
  appId: "1:410398666813:web:210e9cf8684412e007ba54",
  measurementId: "G-ZKT2BBWTXS",
};

firebase.initializeApp(firebaseConfig);

export default firebase;
