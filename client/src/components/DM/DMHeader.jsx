import React, { useEffect } from "react";
import styled from "styled-components";
import { Container } from "../../styledComponents/styled";
import pattern from "../../img/rodion-kutsaev-tras3_pvEic-unsplash.jpg";
import { useHistory } from "react-router-dom";

const Header = styled.header`
  width: 100%;
  background-image: url(${pattern});
  background-size: 200%;
  overflow: auto;
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

function DMHeader() {
  const history = useHistory();

  useEffect(() => {
    return () => {};
  });
  return (
    <Header>
      <Container>
        <GoBack
          onClick={() => {
            history.goBack();
          }}
        >
          Go Back
        </GoBack>
        <Name></Name>
      </Container>
    </Header>
  );
}

export default DMHeader;
