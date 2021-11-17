const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const firebase = require("./firebase");
const cors = require("cors");

const db = firebase.firestore();

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send("Why are you here?");
});

io.on("connection", (socket) => {
  socket.on("join_dm", async ({ roomName, friend, user }) => {
    socket.join(roomName);

    await db
      .collection("users")
      .doc(friend)
      .collection("dm_users")
      .doc(user)
      .update({
        unread: 0,
      });

    await db
      .collection("users")
      .doc(friend)
      .collection("dm_users")
      .doc(user)
      .update({
        hasRead: true,
      });

    socket.to(friend).emit("update_dms");
  });

  // typing event
  socket.on("typing", ({ state, roomName, author }) => {
    socket.to(roomName).emit("typing", { state, author });
  });

  socket.on("join_app", (userUid) => {
    socket.join(userUid);
  });

  socket.on("pm", async ({ roomName, msg, author, timestamp, opponent }) => {
    let error = null;

    let userRef = await db
      .collection("users")
      .doc(author)
      .collection("dm_users")
      .doc(opponent)
      .get();
    let currentMessages = userRef.data().messages;

    try {
      // updating on the sender side
      await db
        .collection("users")
        .doc(author)
        .collection("dm_users")
        .doc(opponent)
        .update({
          messages: [...currentMessages, { message: msg, author, timestamp }],
          lastTimestamp: timestamp,
        });

      // updating on the recipient side
      await db
        .collection("users")
        .doc(opponent)
        .collection("dm_users")
        .doc(author)
        .update({
          messages: [...currentMessages, { message: msg, author, timestamp }],
          lastTimestamp: timestamp,
        });
    } catch (e) {
      error = e.message;
    }

    let ref = await db
      .collection("users")
      .doc(author)
      .collection("dm_users")
      .doc(opponent)
      .get();

    if (!userRef.data().hasRead) {
      let currentUnread = ref.data().unread;

      await db
        .collection("users")
        .doc(author)
        .collection("dm_users")
        .doc(opponent)
        .update({
          unread: currentUnread + 1,
        });
    } else {
      await db
        .collection("users")
        .doc(author)
        .collection("dm_users")
        .doc(opponent)
        .update({
          unread: 0,
        });
    }

    socket.broadcast
      .to(roomName)
      .emit("msg", { msg, author, timestamp, error, opponent });

    if (!userRef.data().hasRead) {
      let currentUnread = ref.data().unread;
      socket
        .to(opponent)
        .emit("newMsg", { author, msg, unreadCount: currentUnread });
    }
  });

  socket.on("user_deleted", ({ room, appId, opponentUid }) => {
    socket.to(appId).emit("update_dms");
    socket.to(room).emit("user_deleted");
  });

  socket.on("end", async ({ roomId, profileUid, opponentUuid }) => {
    socket.leave(roomId);

    await db
      .collection("users")
      .doc(opponentUuid)
      .collection("dm_users")
      .doc(profileUid)
      .update({
        hasRead: false,
      });
  });
});

server.listen(process.env.PORT || 5000, () => {
  console.log("Listening on port 5000");
});
