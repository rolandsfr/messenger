import React, { useEffect } from "react";
import styled from "styled-components";
import { useSpring, animated } from "react-spring";

const Screen = styled.div`
  width: 100vw;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  background: #fafafa;
  display: flex;
  font-size: 2rem !important;
  z-index: 100;
  align-items: center;
  justify-content: center;
  font-family: "Roboto" !important;

  * {
  font-family: "Roboto" !important;
  }

  div {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @keyframes arrows {
    0%,
    100% {
      color: black;
      transform: translateY(0);
    }
    50% {
      color: #3ab493;
      transform: translateY(20px);
    }
  }

  span {
    --delay: 0s;
    animation: arrows 1s var(--delay) infinite ease-in;
  }
`;

function Preloader({ loading }) {
  const [spring, api] = useSpring(
    {
      from: { opacity: 1, display: "flex" },
    },
    []
  );

  useEffect(() => {
    if (!loading) {
      api({
        to: async (next) => {
          await next({ opacity: 0 });
          await next({ display: "none" });
        },
      });
    }
  }, [loading]);
  return (
    <Screen style={spring} as={animated.div}>
      <div>
        <span>↓</span>
        <span style={{ "--delay": "0.1s" }}>↓</span>
        <span style={{ "--delay": "0.3s" }}>↓</span>
        <span style={{ "--delay": "0.4s" }}>↓</span>
        <span style={{ "--delay": "0.5s" }}>↓</span>
      </div>
    </Screen>
  );
}

export default Preloader;
