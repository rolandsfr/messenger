import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useHistory, Link, BrowserRouter } from "react-router-dom";
import styled from "styled-components";
import {
  UPDATE_UNREAD,
  UPDATE_LATEST_MESSAGE,
} from "../../redux/userInstanceReducer";

import { sagaMiddleware } from "../../redux/store";
import friendsSaga from "../../sagas/friends";
import firebase from "../../firebase";
import "firebase/auth";
import FeedHeader from "../FeedHeader/FeedHeader";
import { RETURN_DMS, UPDATE_TYPING } from "../../redux/userInstanceReducer";
import { io } from "socket.io-client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { useSpring, useSprings, config, animated } from "react-spring";
import checkForPfp from "../../utils/checkForPfp";
import replaceWithEmoji from "../../utils/replaceWithEmoji";
import Preloader from "../Preloader/Preloader";
import algoliasearch from "algoliasearch";

// styled components
import { Container } from "../../styledComponents/styled";

const db = firebase.firestore();
const auth = firebase.auth();

const DM_UI = styled.div`
  width: 100%;
  background: #fafafa;
  height: 70vh;
  position: relative;
`;

const NoDms = styled.div`
  width: 100%;
  background: #fafafa;
  height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  flex-direction: column;

  .innerContent {
    position: relative;
    display: flex;
    align-items: center;
    flex-direction: column;
  }

  p {
    color: #c4c4c4;
    line-height: 1.5;
    font-size: 1.6rem;
    max-width: 350px;
    text-align: center;
  }

  input {
    margin-top: 2em;
    font-size: 1.5rem;
    border: 1px solid #ccc;
    outline: none;
    background-color: #f8f8f8;
    height: 20px;
    border-radius: 16px;
    padding: 0.2em 0.8em;
    min-width: 250px;

    &::placeholder {
      color: #b3b3b3;
    }
  }

  @media (max-width: 768px) {
    position: static;
    height: auto;
    background: none;
    margin-top: 5em;
    height: 70vh;
    display: block !important;

    p {
      width: 100%;
      max-width: 350px;
    }

    input {
      width: 100%;
      max-width: 200px;
    }
  }
`;

const DMBlock = styled.div`
  display: inline-flex;
  align-items: center;
  position: relative;
  color: #000;
`;

const Pfp = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 100%;
  background: #d4d4d4;
  margin-right: 2em;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  span {
    color: #000;
    font-size: 1.4rem;
    font-weight: bold;
  }
`;

const DMName = styled.p`
  font-weight: bold;
  font-size: 1.6rem;
`;

const LatestMsg = styled.p`
  font-size: 1.4rem;
  margin-top: 0.3em;
  line-height: 1.2;
`;

const LatestMsgTime = styled.span`
  color: #ccc;
  font-size: 1.2rem;
  margin-left: 1.5em;
  margin-top: 0.1em;
`;

const DMDescription = styled.div`
  display: inline-flex;
  flex-direction: column;
`;

const Top = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const DMsWrapper = styled.div`
  display: inline-flex;
  flex-direction: column;

  @media (min-width: 768px) {
    background: #f3f3f3;
    width: 62vw;
    max-width: 320px;

    ${DMBlock} {
      width: 100%;
      padding: 2em;
      transition: 0.3s all;
      border-bottom: 1px solid #e6e6e6;
      box-sizing: border-box;

      &:hover {
        background: #eeeeee;
      }
    }
  }

  @media (max-width: 768px) {
    a {
      background: none !important;
    }
  }
`;

const UnreadNotif = styled.div`
  background: red;
  border-radius: 100%;
  display: inline-block;
  width: 15px;
  height: 15px;
  font-size: 1rem;
  color: #fff;
  position: absolute;
  right: 0;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const InputBlock = styled.div`
  display: flex;
  align-items: center;
  width: 90%;
  padding: 1em;
  background-color: #f3f3f3;
  border-radius: 40px;
  margin-bottom: 1em;
  font-size: 1.3rem;
  justify-content: space-between;
  box-sizing: border-box;
  margin: 0 auto;
`;

const TypeInput = styled.input`
  background: none;
  outline: none;
  border: none;
  margin-left: 0.5em;
  width: 80%;
  &::placeholder {
    color: #bbbbbb;
  }
`;

const Overlap = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  background: #fafafa;
  padding: 3.5em 0;
`;

const MessageBlob = styled.div`
  background: ${(props) => (!props.opponent ? "#e5eff0" : "#fafafa")};
  display: inline-flex;
  flex-direction: column;
  padding: 1.1em;
  border-radius: 20px;
  border-bottom-left-radius: ${(props) => (props.opponent ? "0" : "20px")};
  border-bottom-right-radius: ${(props) => (props.opponent ? "20px" : "0")};
  margin-left: ${(props) => (props.opponent ? "0" : "auto")};
  margin-right: ${(props) => (!props.opponent ? "0" : "auto")};
  margin-top: 1.5em;
  font-size: 1.3rem;
  line-height: 1.5;
  max-width: 185px;
  overflow-wrap: break-word;
  overflow: hidden;
  word-break: break-all;
  white-space: normal;

  @media (min-width: 768px) {
    background: ${(props) => (!props.opponent ? "#e5eff0" : "#f5f5f5")};
  }
`;

const MessageBlock = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 90%;
  margin: 0 auto;

  .date {
    color: #ccc;
    margin-top: 1.5em;
  }

  ${Pfp} {
    margin-right: 2em;
  }
`;

const Wrapper = styled.main`
  width: 100vw;
  overflow: hidden;

  .main-container {
    display: flex;
    position: relative;
  }

  @media (max-width: 768px) {
    ${DM_UI} {
      display: none;
    }
  }

  @media (min-width: 768px) {
    .main-container {
      margin-top: 5em;
      margin-bottom: 5em;
    }

    a {
      margin-top: 0 !important;
      outline: none;
      border: none;
    }
  }
`;

const SendIcon = styled.div`
  padding: 1em;
  background-color: #2768c9;
  border-radius: 100%;
  font-size: 0.9rem;
  position: absolute;
  right: 6.3%;
  cursor: pointer;

  svg {
    color: #fff;
  }
`;

const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;
  padding-top: 2em;
  overflow-y: scroll;
  height: 71%;

  ${Pfp} {
    margin-top: 2em;
  }
`;

const Typing = styled.div`
  display: flex;
  align-items: center;
  margin-left: 2em;

  p {
    margin-left: 0.4em;
    font-size: 1.4rem;
    font-weight: bold;
    margin-top: 1.8em;
  }
`;

const StartConvo = styled.p`
  font-size: 1.3rem;
  text-align: center;
  color: #ccc;
  margin-top: 0.5em;
  max-width: 240px;
  line-height: 1.8;
  display: inline-block;
  margin-left: auto;
  margin-right: auto;
`;

const MsgError = styled.p`
  font-size: 1.4rem;
  max-width: 200px;
  color: red;
  margin-top: 1em;
  line-height: 1.7;
  margin-right: -2em;
`;

const Blob = styled.div`
  display: inline-flex;
  flex-direction: column;
  margin-left: 4em;

  @media (min-width: 768px) {
    margin-left: 0;
  }
`;

const AutoComplete = styled.div`
  display: flex;
  width: 100%;
  position: absolute;
  left: 0;
  top: 0;
  margin-top: 13em;
  flex-direction: column;
  z-index: 1000000;
  width: 100%;
  border-radius: 7px;
  box-sizing: border-box;
  font-family: "Roboto";
  background: #fff;
  overflow: hidden;

  div {
    padding: 0.9em;
    border-bottom: 1px solid #eeeded;
    transition: 0.3s all;
    box-sizing: border-box;
    overflow: hidden;
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    cursor: pointer;

    p {
      color: #000;
    }

    &:last-of-type {
      border: none;
    }

    &:hover {
      background: #f3f3f3;
    }

    .name {
      font-size: 1.3rem;
    }

    .email {
      margin-top: -0.2em;
      font-size: 1rem;
    }
  }

  @media (max-width: 768px) {
    background-color: #fafafa;
  }
`;

function Feed() {
  const dispatch = useDispatch();
  const history = useHistory();

  const { dms } = useSelector((state) => state.userInstance);
  const { activeUser } = useSelector((state) => state.friendsBar);

  const [latestMsg, setLatestMsg] = useState("");
  const typeInputRef = useRef();
  const [messages, setMessages] = useState([]);
  const temp = useRef([]);
  const roomName = useRef(null);
  const friendUid = useRef(null);
  const [userName, setUserName] = useState("");
  const [haveMessages, setHaveMessages] = useState(false);
  const [currentFriend, setCurrentFriend] = useState("");
  const [currentUser, setCurrentUser] = useState({ typing: false });
  const [isDesktop, setIsDesktop] = useState(false);
  const [hasBeenFetched, setHasBeenFetched] = useState(false);
  const [initials, setInitials] = useState(null);
  const [opponentPfp, setOpponentPfp] = useState();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [hits, setHits] = useState([]);
  const selfEmail = useRef();
  const [everythingFetched, setEverythingFetched] = useState(false);

  const [message, setMessage] = useState("");
  const [messageHistory, setMessageHistory] = useState([]);
  const [storage, setStorage] = useState(null);
  const bottomRef = useRef();

  function setImmidietaly(unreadCount, author) {
    dispatch(UPDATE_UNREAD({ unread: unreadCount + 1, uid: author }));
  }

  function checkForDesktop() {
    const BREAKPOINT = 768;
    let w = document.body.offsetWidth;

    if (w <= BREAKPOINT) {
      setIsDesktop(false);
    } else {
      setIsDesktop(true);
    }
  }

  function sendMessage(socket) {
    if (!message.length) return;

    let resMsg = replaceWithEmoji(message);

    if (socket) {
      socket.emit("pm", {
        roomName: roomName.current,
        msg: resMsg,
        author: auth.currentUser.uid,
        timestamp: Date.now(),
        opponent: currentFriend,
      });
    }

    setMessage("");
    setHaveMessages(true);

    dispatch(UPDATE_UNREAD({ unread: 0, uid: currentFriend }));
  }

  const searchClient = algoliasearch(
    "VGFDJPQ3IH",
    "bf1ba84694dcbf3d5f8eb044fab4abfe"
  );

  const index = searchClient.initIndex("users");

  const socket = io("https://roly-react-messenger-app.herokuapp.com/");

  const [planeStyles, api] = useSpring(
    {
      from: { display: "none", opacity: 0, x: -10 },
      config: config.wobbly,
    },
    []
  );

  useEffect(async () => {
    if (activeUser && isDesktop) {
      const doc = await db
        .collection("users")
        .doc(auth.currentUser.uid)
        .collection("dm_users")
        .doc(activeUser.uid)
        .get();

      await initDm(activeUser.uid, doc.data().roomId);
    }
  }, [activeUser]);

  useEffect(async () => {
    checkForDesktop();

    let selfInstance = await db
      .collection("users")
      .doc(auth.currentUser.uid)
      .get();
    selfEmail.current = selfInstance.data().email;

    socket.emit("join_app", auth.currentUser.uid);
    dispatch({ type: "REQUEST_CURRENT_DMS" });

    socket.on("newMsg", ({ author, msg, unreadCount }) => {
      dispatch(UPDATE_LATEST_MESSAGE({ msg: msg, uid: author }));
      if (author === auth.currentUser.uid || author === friendUid.current)
        setHaveMessages(true);
      if (author === auth.currentUser.uid) return;
      setImmidietaly(unreadCount, author);
      dispatch({ type: "REQUEST_CURRENT_DMS" });
    });

    window.addEventListener("resize", checkForDesktop);

    let oneself = await db.collection("users").doc(auth.currentUser.uid).get();
    setInitials({
      own: [
        oneself.data().name.split(" ")[0],
        oneself.data().name.split(" ")[1],
      ],
      opponent: [],
    });

    const firstRecord = await db
      .collection("users")
      .doc(auth.currentUser.uid)
      .collection("dm_users")
      .orderBy("lastTimestamp", "desc")
      .limit(1)
      .get();

    setHasBeenFetched(true);

    let allDocs = [];

    firstRecord.forEach((doc) => allDocs.push(doc));

    if (isDesktop) {
      await Promise.all(
        allDocs.map(async (doc) => {
          await initDm(doc.id, doc.data().roomId);
        })
      );
    }

    setLoading(false);
    setEverythingFetched(true);
  }, []);

  useEffect(() => {
    if (dms.length) {
      let currentRef = dms.find((dm) => dm.uid === friendUid.current);
      setCurrentUser(currentRef);
    }

    (async () => {
      if (dms.length === 1 && !friendUid.current) {
        let room = await db
          .collection("users")
          .doc(auth.currentUser.uid)
          .collection("dm_users")
          .doc(dms[0].uid)
          .get();

        initDm(dms[0].uid, room.data().room);
      }
    })();
  }, [dms]);

  useEffect(() => {
    socket.on("update_dms", () => {
      dispatch({ type: "REQUEST_CURRENT_DMS" });
    });

    auth.onAuthStateChanged((user) => {
      if (!user) {
        history.push("/");
      }
    });

    return () => {
      if (friendUid.current) {
        socket.emit("end", {
          roomId: roomName.current,
          profileUid: auth.currentUser.uid,
          opponentUuid: friendUid.current,
        });
      }

      socket.off();
    };
  }, []);

  async function getUserName(uid) {
    const doc = await db.collection("users").doc(uid).get();
    setUserName(doc.data().name);
  }

  const [bubbleSprings, bubbleApi] = useSprings(temp.current.length, (i) => ({
    from: { transform: "translateY(20px)", opacity: 0 },
  }));

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  async function initDm(friendsUid, room) {
    setHasBeenFetched(false);
    setHaveMessages("");
    temp.current = [];
    setMessages([]);
    setOpponentPfp(null);

    let snap = await db
      .collection("users")
      .doc(auth.currentUser.uid)
      .collection("dm_users")
      .get();

    socket.on("update_dms", () => {
      dispatch({ type: "REQUEST_CURRENT_DMS" });
    });

    if (!snap.size) {
      setHasBeenFetched(true);
      return;
    }

    friendUid.current = friendsUid;
    await setLocalUuidStorage(auth.currentUser.uid, friendsUid);
    roomName.current = room;

    setLocalUuidStorage(auth.currentUser.uid, friendsUid);

    let userInstance = await db
      .collection("users")
      .doc(auth.currentUser.uid)
      .collection("dm_users")
      .doc(friendsUid)
      .get();

    let pfpRes = await checkForPfp(friendsUid);

    if (pfpRes.type === "image") {
      setOpponentPfp(pfpRes.value);
    }

    let friendInstance = await db.collection("users").doc(friendsUid).get();

    let initials = {};

    initials.opponent = [
      userInstance.data().name.split(" ")[0][0],
      userInstance.data().name.split(" ")[1][0],
      friendInstance.data().color || "#d4d4d4",
    ];

    setInitials(initials);

    setHasBeenFetched(true);

    setMessageHistory(userInstance.data().messages);

    if (userInstance.data().messages.length) setHaveMessages(true);
    else setHaveMessages(false);
    roomName.current = userInstance.data().roomId;

    if (isDesktop) {
      socket.emit("join_dm", {
        roomName: userInstance.data().roomId,
        friend: friendsUid,
        user: auth.currentUser.uid,
      });
    }

    socket.on("typing", ({ author, state }) => {
      if (!auth.currentUser) return;
      if (author === auth.currentUser.uid) return;

      if (state) scrollToBottom();

      dispatch(UPDATE_TYPING({ uid: author, typingState: state }));
    });

    setCurrentFriend(friendsUid);

    socket.on("msg", async ({ msg, author, timestamp, error, opponent }) => {
      dispatch(UPDATE_LATEST_MESSAGE({ msg: msg, uid: opponent }));
      dispatch({ type: "REQUEST_CURRENT_DMS" });

      if (opponent !== friendUid.current && author === auth.currentUser.uid)
        return;

      temp.current = removeDuplicates(
        [...temp.current, { msg, author, timestamp, error }],
        timestamp
      );
      setMessages(temp.current);

      scrollToBottom();

      bubbleApi.start((index) => ({
        opacity: 1,
        transform: "translateY(0px)",
      }));
    });

    scrollToBottom();
  }

  useEffect(async () => {
    if (friendUid.current) {
      socket.emit("end", {
        roomId: roomName.current,
        profileUid: auth.currentUser.uid,
        opponentUuid: friendUid.current,
      });
    }

    if (isDesktop) {
      dispatch({ type: "REQUEST_CURRENT_DMS" });
      const firstRecord = await db
        .collection("users")
        .doc(auth.currentUser.uid)
        .collection("dm_users")
        .orderBy("lastTimestamp", "desc")
        .limit(1)
        .get();

      firstRecord.forEach((doc) => {
        initDm(doc.id, doc.data().roomId);
      });

      let currentRef = dms.find((dm) => dm.uid === friendUid.current);
      setCurrentUser(currentRef);
    }
  }, [isDesktop]);

  function removeDuplicates(arr, timestamp) {
    let result = [];
    let duplicateRemoved = false;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].timestamp === timestamp) {
        if (!duplicateRemoved) {
          result.push(arr[i]);
        }
        duplicateRemoved = true;
        continue;
      }

      result.push(arr[i]);
    }

    return result;
  }

  function getUserNameFromUuid(uuid) {
    if (!storage) return null;
    return storage[uuid];
  }

  async function setLocalUuidStorage(user, friend) {
    const userInstance = await db.collection("users").doc(user).get();
    let userName = userInstance.data().name;

    const friendInstance = await db.collection("users").doc(friend).get();
    let friendName = friendInstance.data().name;

    setStorage({ [user]: userName, [friend]: friendName });
  }

  function formatDate(timestamp) {
    let hours = String(new Date(timestamp).getHours());
    let minutes = String(new Date(timestamp).getMinutes());
    minutes = minutes.length === 1 ? "0" + minutes : minutes;
    return hours + ":" + minutes;
  }

  return (
    <div>
      <Preloader loading={loading} />
      <Wrapper style={loading ? { height: "100vh", overflow: "hidden" } : {}}>
        <FeedHeader dms={dms} />
        <Container className="main-container">
          {everythingFetched && dms.length ? (
            <DMsWrapper>
              {dms.map((dm) => {
                return (
                  <Link
                    key={dm.email}
                    style={
                      friendUid.current === dm.uid
                        ? {
                            textDecoration: "none",
                            marginTop: "4em",
                            background: "#eee",
                          }
                        : {
                            textDecoration: "none",
                            marginTop: "4em",
                          }
                    }
                    to={isDesktop ? "/feed" : `feed/${dm.uid}`}
                    onClick={async () => {
                      if (friendUid.current === dm.uid) return;

                      if (!isDesktop) return;

                      if (friendUid.current) {
                        socket.emit("end", {
                          roomId: roomName.current,
                          profileUid: auth.currentUser.uid,
                          opponentUuid: friendUid.current,
                        });
                      }

                      initDm(dm.uid, roomName.current);
                    }}
                  >
                    <DMBlock>
                      <Pfp
                        style={
                          dm.img
                            ? {
                                backgroundImage: `url(${dm.img})`,
                                backgroundSize: "cover",
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "center",
                              }
                            : { backgroundColor: dm.color }
                        }
                      >
                        {!dm.img ? (
                          <div>
                            <span>{dm.name.split(" ")[0][0]}</span>
                            <span>{dm.name.split(" ")[1][0]}</span>
                          </div>
                        ) : (
                          ""
                        )}
                        {dm.unread > 0 ? (
                          <UnreadNotif>{dm.unread}</UnreadNotif>
                        ) : (
                          ""
                        )}
                      </Pfp>
                      <DMDescription>
                        <Top>
                          <DMName>{dm.name}</DMName>
                          {dm.time ? (
                            <LatestMsgTime>{formatDate(dm.time)}</LatestMsgTime>
                          ) : (
                            ""
                          )}
                        </Top>
                        <LatestMsg>
                          {dm.lastMessage
                            ? !latestMsg
                              ? dm.lastMessage.length >= 30
                                ? dm.lastMessage.slice(0, 30) + "..."
                                : dm.lastMessage
                              : latestMsg.length >= 30
                              ? latestMsg.slice(0, 30) + "..."
                              : latestMsg
                            : "Start this conversation now!"}
                        </LatestMsg>
                      </DMDescription>
                    </DMBlock>
                  </Link>
                );
              })}
            </DMsWrapper>
          ) : (
            ""
          )}

          {everythingFetched && dms.length ? (
            isDesktop ? (
              <DM_UI>
                <MessagesContainer
                  style={hasBeenFetched ? {} : { overflow: "hidden" }}
                >
                  {hasBeenFetched ? (
                    haveMessages ? (
                      messageHistory.map(({ author, message, timestamp }) => {
                        return (
                          <MessageBlock key={timestamp}>
                            {author === auth.currentUser.uid ? (
                              <span className="date">
                                {formatDate(timestamp)}
                              </span>
                            ) : (
                              ""
                            )}

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              {author !== auth.currentUser.uid ? (
                                <Pfp
                                  style={
                                    opponentPfp
                                      ? {
                                          backgroundImage: `url(${opponentPfp})`,
                                          backgroundSize: "cover",
                                          backgroundRepeat: "no-repeat",
                                          backgroundPosition: "center",
                                        }
                                      : {
                                          backgroundColor: initials.opponent[2],
                                        }
                                  }
                                >
                                  {!opponentPfp ? (
                                    <div>
                                      <span>{initials.opponent[0]}</span>
                                      <span>{initials.opponent[1]}</span>
                                    </div>
                                  ) : (
                                    ""
                                  )}
                                </Pfp>
                              ) : (
                                ""
                              )}

                              <MessageBlob
                                opponent={
                                  author === auth.currentUser.uid ? 0 : 1
                                }
                              >
                                <p>{message}</p>
                              </MessageBlob>
                            </div>
                            {author !== auth.currentUser.uid ? (
                              <span className="date">
                                {formatDate(timestamp)}
                              </span>
                            ) : (
                              ""
                            )}
                          </MessageBlock>
                        );
                      })
                    ) : (
                      <StartConvo>
                        Set roots for this exciting chatting right now!
                      </StartConvo>
                    )
                  ) : (
                    <StartConvo>Hold on, fetching data...</StartConvo>
                  )}
                  {messages.length
                    ? bubbleSprings.map((styles, i) => {
                        let { author, msg, timestamp, error } = messages[i];
                        return (
                          <MessageBlock key={i}>
                            {author === auth.currentUser.uid ? (
                              <span className="date">
                                {formatDate(timestamp)}
                              </span>
                            ) : (
                              ""
                            )}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              {author !== auth.currentUser.uid ? (
                                <Pfp
                                  style={
                                    opponentPfp
                                      ? {
                                          backgroundImage: `url(${opponentPfp})`,
                                          backgroundSize: "cover",
                                          backgroundRepeat: "no-repeat",
                                          backgroundPosition: "center",
                                        }
                                      : {
                                          backgroundColor: initials.opponent[2],
                                        }
                                  }
                                >
                                  {!opponentPfp ? (
                                    <div>
                                      <span>{initials.opponent[0]}</span>
                                      <span>{initials.opponent[1]}</span>
                                    </div>
                                  ) : (
                                    ""
                                  )}
                                </Pfp>
                              ) : (
                                ""
                              )}

                              <Blob>
                                <MessageBlob
                                  as={animated.div}
                                  style={styles}
                                  opponent={
                                    author === auth.currentUser.uid ? 0 : 1
                                  }
                                >
                                  <p>{msg}</p>
                                </MessageBlob>
                                {error !== null ? (
                                  <MsgError>
                                    This message might not have been sent:{" "}
                                    {error}
                                  </MsgError>
                                ) : (
                                  ""
                                )}
                              </Blob>
                            </div>
                            {author !== auth.currentUser.uid ? (
                              <span>{formatDate(timestamp)}</span>
                            ) : (
                              ""
                            )}
                          </MessageBlock>
                        );
                      })
                    : ""}
                  {currentUser ? (
                    currentUser.typing ? (
                      <Typing>
                        <Pfp
                          style={
                            opponentPfp
                              ? {
                                  backgroundImage: `url(${opponentPfp})`,
                                  backgroundSize: "cover",
                                  backgroundRepeat: "no-repeat",
                                  backgroundPosition: "center",
                                }
                              : { backgroundColor: initials.opponent[2] }
                          }
                        >
                          {!opponentPfp ? (
                            <div>
                              <span>{initials.opponent[0]}</span>
                              <span>{initials.opponent[1]}</span>
                            </div>
                          ) : (
                            ""
                          )}
                        </Pfp>
                        <p>Typing...</p>
                      </Typing>
                    ) : (
                      ""
                    )
                  ) : (
                    ""
                  )}
                  <div
                    style={{
                      marginTop: "30px",
                    }}
                    key="custom"
                    ref={bottomRef}
                  />
                </MessagesContainer>
                {hasBeenFetched ? (
                  <Overlap>
                    <InputBlock>
                      <TypeInput
                        ref={typeInputRef}
                        value={message}
                        onChange={(e) => {
                          let val = e.target.value;
                          let state = false;

                          if (val.length) {
                            state = true;
                          }

                          socket.emit("typing", {
                            roomName: roomName.current,
                            author: auth.currentUser.uid,
                            state,
                          });

                          setMessage(val);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            sendMessage(socket);

                            socket.emit("typing", {
                              roomName: roomName.current,
                              author: auth.currentUser.uid,
                              state: false,
                            });
                          }
                        }}
                        onKeyUp={() => {
                          if (message.length) {
                            api({
                              to: {
                                display: "inline-block",
                                opacity: 1,
                                x: 0,
                              },
                            });
                          }

                          if (!message.length) {
                            api({
                              to: async (animate) => {
                                await animate({
                                  opacity: 0,
                                  x: -10,
                                });

                                await animate({
                                  display: "none",
                                });
                              },
                            });
                          }
                        }}
                        placeholder="Type your message..."
                        onBlur={() => {
                          socket.emit("typing", {
                            roomName: roomName.current,
                            author: auth.currentUser.uid,
                            state: false,
                          });
                        }}
                      />
                      <SendIcon
                        onClick={() => {
                          sendMessage(socket);
                        }}
                        as={animated.div}
                        style={planeStyles}
                      >
                        <FontAwesomeIcon icon={faPaperPlane} />
                      </SendIcon>
                    </InputBlock>
                  </Overlap>
                ) : (
                  ""
                )}
              </DM_UI>
            ) : (
              ""
            )
          ) : (
            ""
          )}

          {everythingFetched && !dms.length ? (
            <NoDms>
              <div className="innerContent">
                <p>
                  You have no active conversations, you can start one right now.
                </p>

                <input
                  type="text"
                  value={search}
                  onChange={async (e) => {
                    let val = e.target.value;
                    setSearch(val);

                    if (val.length < 2) {
                      setHits(null);
                    } else {
                      const searchHits = await index.search(val, {
                        getRankingInfo: true,
                        analytics: false,
                        enableABTest: false,
                        hitsPerPage: 3,
                        attributesToRetrieve: "*",
                        attributesToSnippet: "*:20",
                        snippetEllipsisText: "…",
                        responseFields: "*",
                        explain: "*",
                        page: 0,
                        facets: ["*"],
                      });

                      let res = searchHits.hits.filter(
                        (hit) => hit.email !== selfEmail.current
                      );

                      setHits(res);
                    }
                  }}
                  placeholder="Search a user..."
                />

                {hits ? (
                  hits.length && search.length ? (
                    <AutoComplete>
                      {hits.map((hit, index) => {
                        return (
                          <div
                            onClick={() => {
                              dispatch({
                                type: "REQUEST_NEW_DM",
                                payload: hit.email,
                              });
                              setSearch("");
                            }}
                            key={index}
                          >
                            <p className="name">{hit.name}</p>
                            <p className="email">{hit.email}</p>
                          </div>
                        );
                      })}
                    </AutoComplete>
                  ) : (
                    ""
                  )
                ) : (
                  ""
                )}
              </div>
            </NoDms>
          ) : (
            ""
          )}
        </Container>
      </Wrapper>
    </div>
  );
}

sagaMiddleware.run(friendsSaga);
export default Feed;
