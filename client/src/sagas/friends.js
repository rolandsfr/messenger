import { call, put, takeEvery, all } from "redux-saga/effects";
import firebase from "../firebase";
import { FRIENDS_LIST_FETCHED } from "../redux/friendsReducer";
import { CREATE_NEW_DM, RETURN_DMS } from "../redux/userInstanceReducer";
import "firebase/auth";
import shortid from "shortid";
import checkForPfp from "../utils/checkForPfp";

const db = firebase.firestore();
const friendsRef = db.collection("friends");
const auth = firebase.auth();

async function fetchFromDB() {
  let friends = [];
  const friendsRef = await db.collection("friends").get();
  const snapshot = friendsRef.forEach((doc) => {
    friends.push({ data: doc.data(), id: doc.id });
  });

  return friends;
}

function* fetchFriends(action) {
  const friends = yield call(fetchFromDB);
  yield put(FRIENDS_LIST_FETCHED(friends));
}

async function fetchUser(email) {
  let creds;
  let dmUserId;

  const snapshot = await db
    .collection("users")
    .where("email", "==", email)
    .get();

  snapshot.forEach((doc) => {
    creds = doc.data();
    dmUserId = doc.id;
  });

  let uid = auth.currentUser.uid;
  let room = shortid.generate();

  // setting up own dms channel
  await db
    .collection("users")
    .doc(uid)
    .collection("dm_users")
    .doc(dmUserId)
    .set({
      messages: [],
      name: creds.name,
      roomId: room,
      hasRead: false,
      unread: 0,
      lastTimestamp: 0,
    });

  const currentUserInstance = await db
    .collection("users")
    .doc(auth.currentUser.uid)
    .get();

  // setting up FRIEND's dms channel
  await db
    .collection("users")
    .doc(dmUserId)
    .collection("dm_users")
    .doc(uid)
    .set({
      messages: [],
      name: currentUserInstance.data().name,
      roomId: room,
      hasRead: false,
      unread: 0,
      lastTimestamp: 0,
    });

  return { ...creds, uid: dmUserId };
}

let dms = [];

function* createDMRequest(action) {
  const user = yield call(fetchUser, action.payload);
  yield put(CREATE_NEW_DM(user));
  yield put({ type: "REQUEST_CURRENT_DMS" });
}

async function fetchCurrentDms() {
  let dms = [];

  const snapshot = await db
    .collection("users")
    .doc(auth.currentUser.uid)
    .collection("dm_users")
    .orderBy("lastTimestamp", "desc")
    .limit(20)
    .get();

  let docs = [];
  snapshot.forEach((doc) => {
    docs.push({ id: doc.id, data: doc.data() });
  });

  await Promise.all(
    docs.map(async (doc) => {
      let payload = {};
      let uid = doc.id;

      const emailSnapshot = await db.collection("users").doc(uid).get();

      let email = emailSnapshot.data().email;

      payload.name = doc.data.name;
      payload.email = email;

      let msgSnapshot = await db
        .collection("users")
        .doc(auth.currentUser.uid)
        .collection("dm_users")
        .doc(uid)
        .get();

      let lastmsg = msgSnapshot.data().messages.length
        ? msgSnapshot.data().messages[msgSnapshot.data().messages.length - 1]
            .message
        : "Tap here to start the conversation";

      payload.lastMessage = lastmsg;

      payload.time = msgSnapshot.data().messages.length
        ? msgSnapshot.data().messages[msgSnapshot.data().messages.length - 1]
            .timestamp
        : Date.now();

      let ref = await db
        .collection("users")
        .doc(uid)
        .collection("dm_users")
        .doc(auth.currentUser.uid)
        .get();

      let currentInstance = await db.collection("users").doc(uid).get();

      payload.unread = ref.data() ? ref.data().unread : 0;
      payload.uid = uid;
      payload.color = currentInstance.data().color || "#d4d4d4";
      dms.push(payload);

      payload.img = null;

      let res = await checkForPfp(uid);
      if (res.type === "image") {
        payload.img = res.value;
      }
    })
  );

  return dms;
}

function* returnDMs() {
  const dms = yield call(fetchCurrentDms);
  yield put(RETURN_DMS(dms));
}

// watcher saga
export default function* watcherSaga() {
  yield all([
    takeEvery("REQUEST_NEW_DM", createDMRequest),
    takeEvery("REQUEST_CURRENT_DMS", returnDMs),
  ]);
}
