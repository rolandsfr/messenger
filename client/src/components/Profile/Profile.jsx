import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Container } from "../../styledComponents/styled";
import checkForPfp from "../../utils/checkForPfp";
import firebase from "../../firebase";
import "firebase/storage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPencilAlt,
  faExclamationTriangle,
  faLongArrowAltLeft,
  faSignOutAlt,
  faTrashAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useSpring, animated } from "react-spring";
import { useHistory } from "react-router-dom";
import imageCompression from "browser-image-compression";
import { useDispatch } from "react-redux";
import { logout } from "../../redux/userReducer";
import { RETURN_DMS } from "../../redux/userInstanceReducer";
import Preloader from "../Preloader/Preloader";
import { io } from "socket.io-client";

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage().ref();

const Wrapper = styled.div`
  font-family: "Open Sans" !important;
  overflow: auto;
  min-height: 100vh;
`;

const ProfileBasic = styled.div`
  display: inline-flex;
  border-radius: 5px;
  align-items: center;
  justify-content: center;
  margin-top: 3em;
`;

const EditPfp = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 100%;
  padding: 0.5em 0.6em;
  cursor: pointer;

  label {
    cursor: pointer;
  }

  svg {
    color: #fff;
    font-size: 0.8rem;
  }
`;

const Pfp = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 100%;
  background: #d4d4d4;
  margin-right: 2.5em;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  span {
    color: #000;
    font-size: 1.4rem;
    font-weight: bold;
  }

  a {
    text-decoration: none;
  }
`;

const BasicInfo = styled.div``;

const Name = styled.p`
  font-size: 1.6rem;
`;
const Email = styled.p`
  font-size: 1.2rem;
  margin-top: 0.4em;
  color: #777;
`;

const MetaData = styled.div`
  display: grid;
  grid-template-columns: 250px 250px;
  margin-top: 5em;
  grid-gap: 4em;

  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 425px) {
    grid-template-columns: 1fr;
    grid-gap: 2em;
    margin-top: 3em;
  }
`;

const Entry = styled.div`
  font-size: 1.4rem;

  &:first-of-type {
    margin-top: 0;
  }

  label {
    font-weight: bold;
  }

  p {
    margin-top: 1em;
    background: #fafafa;
    padding: 0.8em;
    border-radius: 5px;
    border: 1px solid #f1f1f1;
  }
`;

const ProgressBar = styled.div`
  height: 2px;
  background: blue;
  position: fixed;
  top: 0;
  left: 0;
`;

const ErrorMessage = styled.p`
  color: red;
  font-size: 1.4rem;
  margin-top: 1.5em;

  svg {
    margin-right: 0.5em;
  }
`;

const GoBack = styled.div`
  display: flex;
  align-items: center;
  margin-top: 4em;
  cursor: pointer;

  p {
    font-size: 1.5rem;
  }

  svg {
    color: #000;
    font-size: 2rem;
    margin-right: 0.8em;
  }
`;

const Buttons = styled.div`
  display: flex;

  @media (max-width: 425px) {
    width: 100%;
    flex-direction: column;
    text-align: center;
    margin-bottom: 4em;
  }

  button {
    svg {
      margin-right: 1em;
    }
  }
`;

const SignOutButton = styled.button`
  border: none;
  outline: none;
  color: #e21b1b;
  border: 2px solid #e21b1b;
  background: transparent;
  padding: 0.6em 3em;
  cursor: pointer;
  transition: 0.2s all;
  font-size: 1.3rem;
  margin-top: 4em;
  border-radius: 4px;
  font-family: "Roboto";

  svg {
    margin-right: 0.5em !important;
  }

  @media (max-width: 425px) {
    width: 100%;
    display: inline-block;
    text-align: center;
    margin-top: 2.5em;
    padding: 0.8em 3em;
  }

  &:hover {
    background-color: #e21b1b;
    color: #fff;
  }
`;

const DeleteButton = styled.button`
  color: #fff;
  border: none;
  outline: none;
  background-color: #e21b1b;
  box-sizing: border-box;
  padding: 0.6em 3em;
  cursor: pointer;
  transition: 0.2s all;
  font-size: 1.3rem;
  margin-top: 4em;
  border-radius: 4px;
  font-family: "Roboto";
  margin-left: 2em;

  @media (max-width: 425px) {
    width: 100%;
    display: inline-block;
    text-align: center;
    margin-top: 2.3em;
    margin-left: 0em;
    padding: 1em 3em;
  }

  &:hover {
    background-color: #ce1313;
  }
`;

export default function Profile() {
  const [pfp, setPfp] = useState(null);
  const [user, setUser] = useState();
  const [userInfo, setUserInfo] = useState(null);
  const [file, setFile] = useState();
  const [url, setUrl] = useState();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [loading, setLoading] = useState(true);

  const socket = io("https://roly-react-messenger-app.herokuapp.com/");

  const progressSpring = useSpring({
    width: uploadProgress + "%",
  });

  const history = useHistory();
  const dispatch = useDispatch();

  useEffect(async () => {
    if (!file) return;

    let images = await storage.child(`users/${user.uid}/`).listAll();

    if (images.items.length) {
      let img = images.items[0];
      let res = await img.delete();
    }

    let avatar = storage.child(`users/${user.uid}/avatar`);

    let compressed = await imageCompression(file, { maxWidthOrHeight: 800 });

    let uploadTask = avatar.put(compressed);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        let percentage =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(percentage);
      },
      (error) => {
        setUploadProgress(0);
        setUploadError(error);
      },
      () => {
        uploadTask.snapshot.ref.getDownloadURL().then(async () => {
          setUploadProgress(0);
          setUploadError("");
          let pfp = await checkForPfp(user.uid);
          setPfp(pfp);
        });
      }
    );
  }, [file]);

  useEffect(() => {
    let timeout = setTimeout(() => {
      if (!user) history.push("/home");
    }, 2000);

    return () => {
      clearTimeout(timeout);
    };
  }, [user]);

  useEffect(async () => {
    if (user) {
      let pfp = await checkForPfp(user.uid);
      setPfp(pfp);

      let userInstance = await db.collection("users").doc(user.uid).get();
      let userDms = await db
        .collection("users")
        .doc(user.uid)
        .collection("dm_users")
        .get();

      let dmsCount = 0;
      let currentUnreads = 0;
      let mostActiveDm = null;

      let dmSizes = [];
      let mostMessages = 0;
      let activeDm = null;

      let allDocs = [];

      userDms.forEach((doc) => allDocs.push(doc));

      await Promise.all(
        allDocs.map(async (dm) => {
          dmsCount++;
          dmSizes.push(dm.data().messages.length);

          let friendDm = await db
            .collection("users")
            .doc(dm.id)
            .collection("dm_users")
            .doc(user.uid)
            .get();

          currentUnreads += friendDm.data().unread;
        })
      );

      mostMessages = dmSizes.sort((a, b) => b - a)[0];

      userDms.forEach((dm) => {
        if (dm.data().messages.length === mostMessages) activeDm = dm;
      });

      setUserInfo({
        name: userInstance.data().name,
        email: userInstance.data().email,
        dmsCount,
        signUpDate: user.metadata.creationTime,
        signInDate: user.metadata.lastSignInTime,
        currentUnreads,
        mostActiveDm: activeDm
          ? activeDm.data().name
          : "User does not have any dms",
      });

      setLoading(false);
    }

    auth.onAuthStateChanged((user) => {
      setUser(user);
    });
  }, [user]);

  function formatDate(date) {
    return `${date.getDate() <= 9 ? "0" + date.getDate() : date.getDate()}/${
      date.getMonth() + 1 <= 9
        ? "0" + (date.getMonth() + 1)
        : date.getMonth() + 1
    }/${date.getFullYear()}`;
  }

  return (
    <Wrapper>
      <Preloader loading={loading} />
      <ProgressBar as={animated.div} style={progressSpring}></ProgressBar>
      {userInfo ? (
        <Container>
          <GoBack
            onClick={() => {
              history.push("/home");
            }}
          >
            <FontAwesomeIcon icon={faLongArrowAltLeft} />
            <p>Go Back</p>
          </GoBack>
          <ProfileBasic>
            {pfp ? (
              <Pfp
                style={
                  pfp.type === "initials"
                    ? { backgroundColor: pfp.value.color }
                    : {
                        backgroundImage: `url(${pfp.value})`,
                        backgroundSize: "cover",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                      }
                }
              >
                {pfp.type === "initials" ? (
                  <span>{pfp.value.initials[0]}</span>
                ) : (
                  ""
                )}
                {pfp.type === "initials" ? (
                  <span>{pfp.value.initials[1]}</span>
                ) : (
                  ""
                )}
                <EditPfp>
                  <label htmlFor="pfpSelector">
                    <FontAwesomeIcon icon={faPencilAlt}>/</FontAwesomeIcon>
                  </label>

                  <input
                    style={{ display: "none" }}
                    type="file"
                    id="pfpSelector"
                    accept=".jpeg, .jpg, .png, .gif"
                    onChange={(e) => {
                      setFile(e.target.files[0]);
                    }}
                  />
                </EditPfp>
              </Pfp>
            ) : (
              <Pfp></Pfp>
            )}
            <BasicInfo>
              <Name>{userInfo.name}</Name>
              <Email>{userInfo.email}</Email>
            </BasicInfo>
          </ProfileBasic>
          {uploadError && (
            <ErrorMessage>
              <FontAwesomeIcon icon={faExclamationTriangle} />
              {uploadError}
            </ErrorMessage>
          )}
          <MetaData>
            <Entry>
              <label>Sign up date</label>
              <p>{formatDate(new Date(userInfo.signUpDate))}</p>
            </Entry>

            <Entry>
              <label>Last login date</label>
              <p>{formatDate(new Date(userInfo.signInDate))}</p>
            </Entry>

            <Entry>
              <label>Active dms</label>
              <p>{userInfo.dmsCount}</p>
            </Entry>

            <Entry>
              <label>Unread messages</label>
              <p>{userInfo.currentUnreads}</p>
            </Entry>

            <Entry>
              <label>Most active with</label>
              <p>{userInfo.mostActiveDm}</p>
            </Entry>
          </MetaData>

          <Buttons>
            <SignOutButton
              onClick={(e) => {
                auth.signOut();
                dispatch(RETURN_DMS([]));
                dispatch(logout());
                history.push("/home");
              }}
            >
              <FontAwesomeIcon icon={faSignOutAlt} /> Sign Out
            </SignOutButton>
            <DeleteButton
              onClick={async (e) => {
                const allDms = await db
                  .collection("users")
                  .doc(auth.currentUser.uid)
                  .collection("dm_users")
                  .get();

                let docArray = [];

                allDms.forEach((doc) => {
                  docArray.push(doc);
                });

                await Promise.all(
                  docArray.map(async (doc) => {
                    // Other user side
                    let fetchedDoc = await db
                      .collection("users")
                      .doc(doc.id)
                      .collection("dm_users")
                      .doc(auth.currentUser.uid)
                      .get();

                    let room = fetchedDoc.data().roomId;
                    let appId = doc.id;
                    let opponentUid = auth.currentUser;

                    await db
                      .collection("users")
                      .doc(doc.id)
                      .collection("dm_users")
                      .doc(auth.currentUser.uid)
                      .delete();

                    socket.emit("user_deleted", {
                      room,
                      appId,
                      opponentUid,
                    });
                  })
                );

                await db.collection("users").doc(auth.currentUser.uid).delete();

                let images = await storage
                  .child(`users/${auth.currentUser.uid}/`)
                  .listAll();

                if (images.items.length) {
                  let img = images.items[0];
                  await img.delete();
                }

                await auth.signOut();
                dispatch(RETURN_DMS([]));
                dispatch(logout());
                history.push("/home");
              }}
            >
              <FontAwesomeIcon icon={faTrashAlt} />
              Delete account
            </DeleteButton>
          </Buttons>
        </Container>
      ) : (
        ""
      )}
    </Wrapper>
  );
}
