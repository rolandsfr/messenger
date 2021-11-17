import { useState, useRef } from "react";
import styled, { css } from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEyeSlash, faEye } from "@fortawesome/free-solid-svg-icons";
import { useSpring, config, animated } from "react-spring";

const RobotoFamily = css`
  @import url("https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap");
  font-family: "Roboto";
`;

const buttonReset = css`
  outline: none;
  font-size: 1.4rem;
  box-sizing: border-box;
`;

const AuthTitle = styled.h2`
  color: #fff !important;
  font-size: 2.5rem;
  font-family: "Montserrat", "Open Sans", "Roboto", sans-serif;
  font-weight: bold;
  margin-top: 2em;
`;

const Button = styled.button`
  ${RobotoFamily}
  ${buttonReset}
  padding: 0.8em 2.4em;
  color: ${(props) => (props.full ? "lightblue" : "white")};
  background-color: ${(props) => (props.full ? "white" : "transparent")};
  border: ${(props) =>
    props.full ? "1px solid transparent" : "1px solid #fff"};
  border-radius: 5px;
  transition: 0.3s all;
  cursor: pointer;

  &:hover {
    color: lightblue;
    background-color: ${(props) => (props.full ? "#f1f1f1" : "white")};
  }

  @media (max-width: 420px) {
    width: 100%;
  }
`;

const AuthBtn = styled.button`
  ${buttonReset}
  ${RobotoFamily}
  padding: 0.8em 2.4em;
  color: ${(props) => (props.primary ? "white" : "gray")};
  background-color: ${(props) => (props.primary ? "lightblue" : "transparent")};
  border-width: 1px;
  border-style: solid;
  border-color: ${(props) => (props.primary ? "transparent" : "gray")};
  border-radius: 5px;
  transition: 0.3s all;

  &:hover {
    color: ${(props) => (props.primary ? "black" : "#fff")};

    background-color: ${(props) => (props.primary ? "#f1f1f1" : "lightblue")};
    border-color: ${(props) => (props.primary ? "transparent" : "transparent")};
  }

  @media (max-width: 420px) {
    width: 100%;
  }
`;

// Custom styled form input

const Input_main = styled.input`
  ${RobotoFamily}
  padding: 0.5em;
  border: none;
  background: none;
  outline: none;
  font-size: 1.4rem;
  width: 100%;
  margin-left: 0.3em;
`;

const Container_main = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  padding-bottom: 1.1em;
  margin-top: 1.3em;
  @media (min-width: 425px) {
    width: 300px;
  }
`;

const Active_input_indicator = styled.span`
  position: absolute;
  left: 0;
  border: none;
  height: 1.5px;
  background-color: lightblue;
  bottom: 5px;
`;

const Input_indicator = styled.hr`
  border: none;
  width: 100%;
  height: 1.5px;
  background-color: #f1f1f1;
`;

const Input_indicator_container = styled.div`
  position: absolute;
  left: 0;
  width: 100%;
  bottom: 0;
`;

const IconHolder = styled.span`
  cursor: pointer;
`;

let clickHappened = false;
function Input({ placeholder, changer, icon, type }) {
  const mainType = useRef(type);

  const [on, set] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [inputType, setInputType] = useState(type);
  const indicatorStyles = useSpring({
    width: on ? "100%" : "0.01%",
  });

  return (
    <Container_main>
      <FontAwesomeIcon icon={icon} />
      <Input_main
        onFocus={() => {
          set(true);
        }}
        onBlur={(e) => {
          if (!clickHappened) {
            set(false);
          } else {
            e.target.focus();
            clickHappened = false;
          }
        }}
        onChange={(e) => {
          changer(e.target.value);
        }}
        placeholder={placeholder}
        type={inputType}
      />

      {mainType.current === "password" ? (
        <IconHolder>
          <FontAwesomeIcon
            onClick={() => {
              setShowPassword(!showPassword);
              if (!showPassword) setInputType("text");
              else setInputType("password");
            }}
            onMouseDown={() => {
              clickHappened = true;
            }}
            icon={showPassword ? faEye : faEyeSlash}
          />
        </IconHolder>
      ) : (
        ""
      )}

      <Input_indicator_container>
        <Input_indicator />
        <Active_input_indicator
          as={animated.span}
          style={indicatorStyles}
        ></Active_input_indicator>
      </Input_indicator_container>
    </Container_main>
  );
}

// Responsive container

const Container = styled.div`
  padding-right: 15px;
  padding-left: 15px;
  margin-right: auto;
  margin-left: auto;
  width: 80vw;

  @media (min-width: 768px) {
    width: 750px;
  }
  @media (min-width: 992px) {
    width: 950px;
  }
  @media (min-width: 1200px) {
    width: 1170px;
  }
`;

export { Button, Container, Input, AuthBtn, AuthTitle };
