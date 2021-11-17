import firebase from "../firebase.js";
import "firebase/storage";
const db = firebase.firestore();
const storage = firebase.storage().ref();

async function checkForPfp(uid) {
  let images = await storage.child(`users/${uid}/`).listAll();

  if (images.items.length) {
    let url = await images.items[0].getDownloadURL();

    return { type: "image", value: url };
  }

  let user = await db.collection("users").doc(uid).get();

  let { name, color } = user.data();

  color = color || "#eee";

  let firstName = name.split(" ")[0][0];
  let lastName = name.split(" ")[1][0];

  return {
    type: "initials",
    value: { initials: [firstName, lastName], color },
  };
}

export default checkForPfp;
