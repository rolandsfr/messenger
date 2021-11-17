import React, { useState, useRef, useEffect } from "react";
import firebase from "../../firebase";
import "firebase/auth";
import { useParams, useHistory } from "react-router-dom";
// import DMHeader from "./DMHeader";
import styled from "styled-components";
import { Container } from "../../styledComponents/styled";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { useSpring, useSprings, config, animated } from "react-spring";
import { io } from "socket.io-client";
import ScrollToBottom, { useScrollToBottom } from "react-scroll-to-bottom";
import checkForPfp from "../../utils/checkForPfp";
import replaceWithEmoji from "../../utils/replaceWithEmoji";
import Preloader from "../Preloader/Preloader";

import pattern from "../../img/rodion-kutsaev-tras3_pvEic-unsplash.jpg";

const Header = styled.header`
  width: 100%;
  background-image: url(${pattern});
  background-size: 200%;
  overflow: auto;
  position: fixed;
  top: 0;
  z-index: 20;
`;

const Name = styled.h1`
  font-size: 4rem;
  color: #fff;
  font-weight: bold;
  font-family: "Montserrat";
  width: 100px;
  line-height: 1.2;
  margin-top: 0.7em;
  margin-bottom: 1.7em;
`;

const GoBack = styled.a`
  color: #f1f1f1;
  font-size: 1.4rem;
  margin-top: 3em;
  text-decoration: none;
  cursor: pointer;
  display: inline-block;
`;

const Wrapper = styled.main`
  width: 100%;
  /* height: 100vh; */

  ${Container} {
    position: relative;
    height: inherit;
  }
`;

const db = firebase.firestore();
const auth = firebase.auth();

const InputBlock = styled.div`
  display: flex;
  align-items: center;
  width: 75vw;
  padding: 1em;
  background-color: #f3f3f3;
  border-radius: 40px;
  margin-bottom: 1em;
  font-size: 1.3rem;
  justify-content: space-between;
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

const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;
  padding-bottom: 10em;
  padding-top: 2em;
  margin-top: 24em;
`;

const SendIcon = styled.div`
  padding: 1em;
  background-color: #2768c9;
  border-radius: 100%;
  font-size: 0.9rem;
  position: absolute;
  right: 2.1em;
  cursor: pointer;

  svg {
    color: #fff;
  }
`;

const Overlap = styled.div`
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
  background: #fff;
  padding: 2em 0;
`;

const MessageBlob = styled.div`
  background: ${(props) => (!props.opponent ? "#e5eff0" : "#fafafa")};
  display: flex;
  flex-direction: column;
  padding: 1.1em;
  border-radius: 20px;
  border-bottom-left-radius: ${(props) => (props.opponent ? "0" : "20px")};
  border-bottom-right-radius: ${(props) => (props.opponent ? "20px" : "0")};
  margin-left: ${(props) => (props.opponent ? "0" : "auto")};
  margin-right: ${(props) => (!props.opponent ? "0" : "auto")};
  display: inline-block;
  max-width: 180px;
  margin-top: 1.5em;
  font-size: 1.3rem;
  line-height: 1.5;

  p {
    display: inline-block;
  }
`;

const MessageBlock = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  span {
    color: #ccc;
    margin-top: 1.5em;
  }
`;

const PFP = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 100%;
  background: #d4d4d4;
  margin-right: 2em;
  margin-top: 3em;
  display: flex;
  font-weight: bold;
  align-items: center;
  justify-content: center;

  span {
    color: #000;
  }
`;

const Typing = styled.div`
  display: flex;
  align-items: center;

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
`;

function DM() {
  let friendUid = useParams().id;

  const [userName, setUserName] = useState("");
  const [message, setMessage] = useState("");
  const [roomName, setRoomName] = useState();
  const [messageHistory, setMessageHistory] = useState([]);
  const [storage, setStorage] = useState(null);
  const [isTyping, setIsTyping] = useState(null);
  const [pfp, setPfp] = useState();
  const [initials, setInitials] = useState();
  const [loading, setLoading] = useState(true);

  const [messages, setMessages] = useState([]);
  const history = useHistory();

  const socket = io("https://roly-react-messenger-app.herokuapp.com/");

  const temp = useRef([]);
  const typeInputRef = useRef();
  const bottomRef = useRef();

  const [planeStyles, api] = useSpring(
    {
      from: { display: "none", opacity: 0, x: -10 },
      config: config.wobbly,
    },
    []
  );

  async function getUserName(uid) {
    const doc = await db.collection("users").doc(uid).get();
    setUserName(doc.data().name);
  }

  const [bubbleSprings, bubbleApi] = useSprings(messages.length, (i) => ({
    from: { transform: "translateY(20px)", opacity: 0 },
  }));

  useEffect(async () => {
    if (friendUid) {
      setLocalUuidStorage(auth.currentUser.uid, friendUid);
      getUserName(friendUid);

      let pfpRes = await checkForPfp(friendUid);

      if (pfpRes.type === "image") {
        setPfp(pfpRes.value);
      }

      let friendInstance = await db.collection("users").doc(friendUid).get();

      let initials = {};

      initials.opponent = [
        friendInstance.data().name.split(" ")[0][0],
        friendInstance.data().name.split(" ")[1][0],
        friendInstance.data().color || "#d4d4d4",
      ];

      setInitials(initials);

      let userInstance = await db
        .collection("users")
        .doc(auth.currentUser.uid)
        .collection("dm_users")
        .doc(friendUid)
        .get();

      setMessageHistory(userInstance.data().messages);

      setRoomName(userInstance.data().roomId);

      socket.emit("join_dm", {
        roomName: userInstance.data().roomId,
        friend: friendUid,
        user: auth.currentUser.uid,
      });

      console.log({
        roomName: userInstance.data().roomId,
        friend: friendUid,
        user: auth.currentUser.uid,
      });

      setLoading(false);

      socket.on("typing", ({ author, state }) => {
        if (author === auth.currentUser.uid) return;

        if (state) scrollToBottom();

        setIsTyping(state);
      });

      scrollToBottom();

      await db
        .collection("users")
        .doc(friendUid)
        .collection("dm_users")
        .doc(auth.currentUser.uid)
        .update({
          hasRead: true,
        });
    }
  }, []);

  useEffect(() => {
    socket.on("msg", ({ msg, author, timestamp, error }) => {
      temp.current = [...temp.current, { msg, author, timestamp, error }];
      setMessages(temp.current);

      scrollToBottom();

      bubbleApi.start((index) => ({
        opacity: 1,
        transform: "translateY(0px)",
      }));
    });

    socket.on("user_deleted", () => {
      history.push("/feed");
    });
  }, [messages]);

  function sendMessage(socket) {
    if (!message.length) return;

    let resMsg = replaceWithEmoji(message);

    if (socket) {
      socket.emit("pm", {
        roomName,
        msg: resMsg,
        author: auth.currentUser.uid,
        timestamp: Date.now(),
        opponent: friendUid,
      });
    }
    setMessages(messages);
    setMessage("");
  }

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
    <Wrapper>
      <Preloader loading={loading} />
      <Header>
        <Container>
          <GoBack
            onClick={() => {
              socket.emit("end", {
                roomId: roomName,
                profileUid: auth.currentUser.uid,
                opponentUuid: friendUid,
              });
              socket.off();
              history.goBack();
            }}
          >
            Go Back
          </GoBack>
          <Name>{userName}</Name>
        </Container>
      </Header>

      <Container>
        <MessagesContainer>
          {messageHistory.length ? (
            messageHistory.map(({ author, message, timestamp }) => {
              return (
                <MessageBlock key={timestamp}>
                  {author === auth.currentUser.uid ? (
                    <span>{formatDate(timestamp)}</span>
                  ) : (
                    ""
                  )}

                  {author !== auth.currentUser.uid ? (
                    <PFP
                      style={
                        pfp
                          ? {
                              backgroundImage: `url(${pfp})`,
                              backgroundSize: "cover",
                              backgroundRepeat: "no-repeat",
                              backgroundPosition: "center",
                            }
                          : { backgroundColor: initials.opponent[2] }
                      }
                    >
                      {!pfp ? (
                        <div>
                          <span>{initials.opponent[0]}</span>
                          <span>{initials.opponent[1]}</span>
                        </div>
                      ) : (
                        ""
                      )}
                    </PFP>
                  ) : (
                    ""
                  )}

                  <MessageBlob
                    opponent={author === auth.currentUser.uid ? 0 : 1}
                  >
                    <p>{message}</p>
                  </MessageBlob>
                  {author !== auth.currentUser.uid ? (
                    <span>{formatDate(timestamp)}</span>
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
          )}
          {messages.length
            ? bubbleSprings.map((styles, i) => {
                let { author, msg, timestamp, error } = messages[i];
                return (
                  <MessageBlock key={i}>
                    {author === auth.currentUser.uid ? (
                      <span>{formatDate(timestamp)}</span>
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
                        <PFP
                          style={
                            pfp
                              ? {
                                  backgroundImage: `url(${pfp})`,
                                  backgroundSize: "cover",
                                  backgroundRepeat: "no-repeat",
                                  backgroundPosition: "center",
                                }
                              : { backgroundColor: initials.opponent[2] }
                          }
                        >
                          {!pfp ? (
                            <div>
                              <span>{initials.opponent[0]}</span>
                              <span>{initials.opponent[1]}</span>
                            </div>
                          ) : (
                            ""
                          )}
                        </PFP>
                      ) : (
                        ""
                      )}

                      <Blob>
                        <MessageBlob
                          as={animated.div}
                          style={styles}
                          opponent={author === auth.currentUser.uid ? 0 : 1}
                        >
                          <p>{msg}</p>
                        </MessageBlob>
                        {error !== null ? (
                          <MsgError>
                            This message might not have been sent: {error}
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
          {isTyping ? (
            <Typing>
              <PFP
                style={
                  pfp
                    ? {
                        backgroundImage: `url(${pfp})`,
                        backgroundSize: "cover",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                      }
                    : { backgroundColor: initials.opponent[2] }
                }
              >
                {!pfp ? (
                  <div>
                    <span>{initials.opponent[0]}</span>
                    <span>{initials.opponent[1]}</span>
                  </div>
                ) : (
                  ""
                )}
              </PFP>
              <p>Typing...</p>
            </Typing>
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
      </Container>
      <Overlap>
        <Container>
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
                  roomName,
                  author: auth.currentUser.uid,
                  state,
                });

                setMessage(val);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage(socket);

                  socket.emit("typing", {
                    roomName,
                    author: auth.currentUser.uid,
                    state: false,
                  });
                }
              }}
              onKeyUp={() => {
                if (message.length) {
                  api({
                    to: { display: "inline-block", opacity: 1, x: 0 },
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
                  roomName,
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
        </Container>
      </Overlap>
    </Wrapper>
  );
}

export default DM;
