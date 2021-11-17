import React from "react";
import { useState } from "react";
import firebase from "../../firebase";
import "firebase/auth";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import {
  AuthTitle,
  Container,
  Input,
  AuthBtn,
} from "../../styledComponents/styled";
import {
  faEnvelope,
  faLock,
  faUser,
  faLongArrowAltLeft,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import backgroundImage from "../../img/freezydreamin-0Bj1foVFTdU-unsplash.jpg";
import randomColor from "randomcolor";
const db = firebase.firestore();
const auth = firebase.auth();

const Wrapper = styled.main`
  width: 100vw;
  position: absolute;
  left: 0;
  bottom: 0em;
  background: #fff;
  padding-bottom: 4em;
  padding-top: 1.5em;

  ${AuthBtn} {
    margin-top: 2em;
  }

  @media (min-width: 425px) {
    position: static;
    width: 330px !important;
    padding: 2em;
    padding-bottom: 4em;
    border-radius: 5px;

    ${Container} {
      width: 100%;
    }

    ${AuthBtn} {
      display: block;
      width: 300px;
    }
  }
`;

const AuthError = styled.p`
  color: #d91a1a;
  font-family: "Roboto";
  font-size: 1.4rem;
  margin-top: 1.5em;
  line-height: 1.5;
`;

const GoBack = styled.div`
  svg {
    margin-top: 1em;
    color: #fff;
    font-size: 2rem;
    cursor: pointer;
    padding: 1em;
    margin-left: -1em;
  }
`;

const Screen = styled.div`
  width: 100vw;
  height: 100vh;
  background-image: url(${backgroundImage});
  background-size: cover;
  position: relative;
  overflow: auto;

  @media (min-width: 425px) {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;

    .welcome {
      display: none;
    }

    ${GoBack}, ${AuthTitle} {
      display: none;
    }
  }
`;

function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const history = useHistory();

  async function signUp() {
    try {
      let splitName = name.trim().split(" ");
      if (splitName.length === 1 || !name.length) {
        throw new Error("Please, enter your full name");
      }

      let resName = "";
      let resNameArr = [];

      resNameArr = splitName.map((piece) => {
        let editedPiece = piece[0].toUpperCase() + piece.slice(1);
        return editedPiece;
      });

      resName = resNameArr.join(" ");

      const credentials = await auth.createUserWithEmailAndPassword(
        email,
        password
      );

      await db.collection("users").doc(credentials.user.uid).set({
        name: resName,
        email,
        color: randomColor(),
      });

      history.push("/feed");
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <Screen>
      <Container>
        <GoBack>
          <FontAwesomeIcon
            onClick={() => {
              history.goBack();
            }}
            icon={faLongArrowAltLeft}
          />
        </GoBack>
        <AuthTitle>Create account</AuthTitle>
      </Container>
      <Wrapper>
        <Container>
          <div className="custom-shape-divider-bottom-1621439037">
            <svg
              data-name="Layer 1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
            >
              <path
                d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                className="shape-fill"
              ></path>
            </svg>
          </div>

          <Input
            icon={faUser}
            type="text"
            changer={setName}
            placeholder="Your full name"
          />
          <Input
            icon={faEnvelope}
            type="email"
            changer={setEmail}
            placeholder="Your email"
          />
          <Input
            icon={faLock}
            type="password"
            changer={setPassword}
            placeholder="Your password"
          />
          {error && <AuthError>{error}</AuthError>}
          <AuthBtn
            primary
            onClick={() => {
              signUp();
            }}
          >
            Sign up
          </AuthBtn>

          <AuthBtn
            onClick={() => {
              history.push("/signin");
            }}
          >
            Log in
          </AuthBtn>
        </Container>
      </Wrapper>
    </Screen>
  );
}

export default SignUp;
