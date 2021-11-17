import React from "react";
import {
  Link,
  Route,
  Switch,
  BrowserRouter as Router,
  withRouter,
  useHistory,
} from "react-router-dom";

import styled from "styled-components";
import { Button, Container } from "../styledComponents/styled";
import backgroundImage from "../img/freezydreamin-0Bj1foVFTdU-unsplash.jpg";

const HomeScreen = styled.main`
  @import url("https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap");
  height: 100vh;
  background-image: url(${backgroundImage});
  background-size: cover;
  font-family: "Roboto";

  ${Container} {
    position: relative;
    height: inherit;
  }
`;

const Wrapper = styled.div`
  height: 100vh;
  position: relative;

  ${Button} {
    margin-top: 2em;
  }

  @media (min-width: 425px) {
    display: flex;
    align-items: center;
  }
`;

const InnerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  bottom: 4em;
  left: 0;
  margin-right: auto;
  margin-left: auto;
  right: 0;
  width: 80vw;
  padding-right: 15px;
  padding-left: 15px;

  @media (min-width: 425px) {
    display: block;
    position: static;

    ${Button} {
      display: inline-block;
      margin-right: 2em;
      width: 150px;
      padding: 0.5em 0;
      margin-top: 0.5em;
    }

    p {
      margin-top: 1.5em;
      line-height: 1.8;
      max-width: 320px;
    }
  }

  @media (min-width: 768px) {
    width: 750px;
  }
  @media (min-width: 992px) {
    width: 970px;
  }
  @media (min-width: 1200px) {
    width: 1170px;
  }
`;

const Heading = styled.h1`
  font-size: 3rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 0.2em;
  line-height: 1.2em;
`;

const Description = styled.p`
  font-size: 1.6rem;
  font-weight: normal;
  color: #fff;
  margin-top: 0.5em;
  margin-bottom: 1.5em;
  line-height: 1.5;
`;

function Home() {
  const history = useHistory();

  return (
    <HomeScreen>
      <Router>
        <Switch>
          <Wrapper>
            <InnerWrapper>
              <Heading>Message your friends effortlessly.</Heading>
              <Description>
                Ever wanted a clean looking messenger app? Just like you,
                handsome' ;). Sign up now and enjoy the smoothest messaging
                experience ever!
              </Description>
              <Button
                full
                onClick={() => {
                  history.push("/signin");
                }}
              >
                Sign in
              </Button>

              <Button
                onClick={() => {
                  history.push("/signup");
                }}
              >
                Sign up
              </Button>
            </InnerWrapper>
          </Wrapper>
        </Switch>
      </Router>
    </HomeScreen>
  );
}

const ShowTheLocationWithRouter = withRouter(Home);

export default ShowTheLocationWithRouter;
