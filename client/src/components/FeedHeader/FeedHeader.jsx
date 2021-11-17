import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  useHistory,
  Link,
  Switch,
  Route,
  BrowserRouter as Router,
} from "react-router-dom";
import ScrollMenu from "react-horizontal-scrolling-menu";
import styled from "styled-components";
import pattern from "../../img/rodion-kutsaev-tras3_pvEic-unsplash.jpg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { useSpring, animated } from "react-spring";
import algoliasearch from "algoliasearch";

import firebase from "../../firebase";
import "firebase/auth";
import checkForPfp from "../../utils/checkForPfp";
import { ACTIVATE_USER } from "../../redux/FriendsBarReducer";

// styled components
import { Container } from "../../styledComponents/styled";

const db = firebase.firestore();
const auth = firebase.auth();

const Comp = () => {
  return <h2>Hi</h2>;
};

const Wrapper = styled.main`
  height: 100vh;
  width: 100vw;
  overflow: hidden;
`;

const Header = styled.header`
  padding: 5em 0em;
  padding-bottom: 5.5em;
  width: 100%;
  background-image: url(${pattern});
  background-size: 200%;

  ${Container} {
    position: relative;
  }
`;

const Heading = styled.h2`
  font-size: 2.3rem;
  font-weight: bold;
  width: 250px;
  color: #fff;
  line-height: 1.4;
`;

const MenuBar = styled.div`
  margin-top: 70px;
  position: relative;

  .menu-wrapper--inner {
    display: flex;
    align-items: center;
  }
`;

const ScrollMenuWrapper = styled.div`
  margin-left: 6em;
`;

const Search = styled.div`
  padding: 0.8em;
  /* width: 1em; */
  background-color: rgba(230, 230, 230, 0.8);
  border-radius: 100%;
  font-size: 1.5rem;
  cursor: pointer;
  display: inline-block;
  position: absolute;
  bottom: 0;

  svg {
    color: #fff;
  }
`;

const SearchInput = styled.input`
  padding: 0;
  background: none;
  border: none;
  outline: none;
  position: absolute;
  margin-left: 0.8em;
  top: 0.7em;
  opacity: 0;
  transition: 0.4s all;
  color: #fff;
  max-width: 100%;

  &::placeholder {
    color: rgba(255, 255, 255, 0.8);
  }
`;

const DMBlock = styled.div`
  display: inline-flex;
  align-items: center;
  position: relative;
  margin-top: 4em;
`;

const PfpMain = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 100%;
  background: #d4d4d4;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: absolute;
  right: 1.5em;
  top: 0;

  span {
    color: #000;
    font-size: 1.4rem;
    font-weight: bold;
  }

  a {
    text-decoration: none;
  }
`;

const Pfp = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 100%;
  background: #d4d4d4;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-right: 2em;

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
  position: absolute;
  top: 0;
  right: 0;
  font-size: 1.3rem;
  color: #ccc;
`;

const DMDescription = styled.div`
  display: inline-flex;
  flex-direction: column;
`;

const DMsWrapper = styled.div`
  display: inline-flex;
  flex-direction: column;
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

const Hits = styled.div`
  display: flex;
  width: 100%;
  position: absolute;
  left: 0;
  top: 0;
  margin-top: 4em;
  flex-direction: column;
  z-index: 1000000;
  width: 100%;
  border-radius: 7px;
  box-sizing: border-box;
  font-family: "Roboto";
  background: #f9f9f9;
  overflow: hidden;
  box-shadow: 0 0 8px 2px rgba(0, 0, 0, 0.1);
  div {
    padding: 0.8em;
    border-bottom: 1px solid #eeeded;
    transition: 0.3s all;
    box-sizing: border-box;
    overflow: hidden;

    &:last-of-type {
      border: none;
    }

    &:hover {
      background: #f3f3f3;
    }

    .email {
      margin-top: 0.5em;
      font-size: 1.2rem;
    }
  }
`;

let once = true;
let clickHappened = false;

function FeedHeader({ dms }) {
  const dispatch = useDispatch();
  const history = useHistory();
  const [showInput, setShowInput] = useState(false);
  const [fade, setFade] = useState(false);
  const iconRef = useRef();
  const iconDefWidth = useRef(0);
  const containerRef = useRef();
  const [searchValue, setSearchValue] = useState("");
  const [pfp, setPfp] = useState(null);
  const [list, setList] = useState();
  const [hits, setHits] = useState(null);
  const [isDesktop, setIsDesktop] = useState(false);

  function checkForDesktop() {
    const BREAKPOINT = 768;
    let w = document.body.offsetWidth;

    if (w <= BREAKPOINT) {
      setIsDesktop(false);
    } else {
      setIsDesktop(true);
    }
  }

  const searchClient = algoliasearch(
    "VGFDJPQ3IH",
    "bf1ba84694dcbf3d5f8eb044fab4abfe"
  );

  const index = searchClient.initIndex("users");

  const { activeUser } = useSelector((state) => state.friendsBar);

  const [searchStyles, api] = useSpring(() => ({
    from: { borderRadius: "100%", width: "15px" },
  }));
  const inputRef = useRef();

  const [friendsBarStyles, api2] = useSpring(() => ({
    from: {
      opacity: 1,
      visibility: "visible",
    },
  }));

  useEffect(async () => {
    let pfp = await checkForPfp(auth.currentUser.uid);
    setPfp(pfp);
  }, []);

  useEffect(() => {
    checkForDesktop();

    window.addEventListener("resize", checkForDesktop);
  });

  useEffect(async () => {
    if (!dms) return;
    let promises = dms.map(async (dm) => {
      let pfpRes = await checkForPfp(dm.uid);

      return (
        <Link
          key={dm.email}
          style={{ textDecoration: "none" }}
          to={isDesktop ? "/feed" : `/feed/${dm.uid}`}
        >
          <Pfp
            onClick={() => {
              dispatch(ACTIVATE_USER(dm));
            }}
            style={
              pfpRes.type === "image"
                ? {
                    backgroundImage: `url(${dm.img})`,
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                  }
                : { backgroundColor: dm.color }
            }
          >
            {pfpRes.type !== "image" ? (
              <div>
                <span>{dm.name.split(" ")[0][0]}</span>
                <span>{dm.name.split(" ")[1][0]}</span>
              </div>
            ) : (
              ""
            )}
            {dm.unread > 0 ? <UnreadNotif>{dm.unread}</UnreadNotif> : ""}
          </Pfp>
        </Link>
      );
    });

    let list = await Promise.all(promises);
    setList(list);
  }, [dms]);

  const toggleFade = () => {
    if (fade) {
      setFade(false);
      setTimeout(() => {
        setShowInput(false);
      }, 400);
    } else {
      setShowInput(true);
      setFade(true);
    }
  };

  return (
    <Header>
      <Container ref={containerRef}>
        <Heading>Chat with your friends</Heading>
        {pfp ? (
          <Link to="/profile">
            <PfpMain
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
            </PfpMain>
          </Link>
        ) : (
          <Pfp></Pfp>
        )}
        <MenuBar>
          <Search ref={iconRef} as={animated.div} style={searchStyles}>
            <FontAwesomeIcon
              icon={faSearch}
              onClick={() => {
                if (once) {
                  iconDefWidth.current = iconRef.current.offsetWidth / 2.5;
                }

                once = false;

                api({
                  to: async (animate) => {
                    await animate({
                      borderRadius: "4px",
                    });
                    setTimeout(() => {
                      toggleFade();
                    }, 200);

                    let styles = window.getComputedStyle(containerRef.current);
                    let padding =
                      parseFloat(styles.paddingLeft) +
                      parseFloat(styles.paddingRight);
                    await animate({
                      width:
                        containerRef.current.clientWidth -
                        padding -
                        iconDefWidth.current * 1.5 +
                        "px",
                    });

                    inputRef.current.focus();
                  },
                });
                api2({
                  to: async (animate) => {
                    await animate({
                      opacity: 0,
                    });
                    await animate({
                      visibility: "hidden",
                    });
                  },
                });
              }}
            />
            <SearchInput
              onBlur={() => {
                if (!clickHappened) {
                } else {
                  clickHappened = false;
                }

                setSearchValue("");
                api({
                  to: async (animate) => {
                    toggleFade();

                    await animate({
                      width: "15px",
                    });

                    await animate({
                      borderRadius: "40px",
                    });
                  },
                });
                setTimeout(() => {
                  api2({
                    to: async (animate) => {
                      await animate({
                        visibility: "visible",
                      });
                      await animate({
                        opacity: 1,
                      });
                    },
                  });
                }, 800);
              }}
              ref={inputRef}
              style={{
                display: showInput ? "inline-block" : "none",
                opacity: fade ? 1 : 0,
              }}
              placeholder="Enter user email..."
              value={searchValue}
              onChange={async (e) => {
                let val = e.target.value;
                setSearchValue(val);

                if (e.target.value.length < 2) {
                  setHits(null);
                } else {
                  const searchHits = await index.search(val, {
                    getRankingInfo: true,
                    analytics: false,
                    enableABTest: false,
                    hitsPerPage: 5,
                    attributesToRetrieve: "*",
                    attributesToSnippet: "*:20",
                    snippetEllipsisText: "…",
                    responseFields: "*",
                    explain: "*",
                    page: 0,
                    facets: ["*"],
                  });

                  const selfInstance = await db
                    .collection("users")
                    .doc(auth.currentUser.uid)
                    .get();
                  let selfEmail = selfInstance.data().email;

                  function compare(otherArray) {
                    return function (current) {
                      return (
                        otherArray.filter(function (other) {
                          return other.email == current.email;
                        }).length == 0
                      );
                    };
                  }

                  let withoutDms = searchHits.hits
                    .filter(compare(dms))
                    .filter((hit) => hit.email !== selfEmail);

                  setHits(withoutDms);
                }
              }}
            />
            {hits ? (
              hits.length && searchValue.length ? (
                <Hits>
                  {hits.map((hit, index) => {
                    return (
                      <div
                        onMouseDown={() => {
                          clickHappened = true;
                          inputRef.current.blur();
                          toggleFade();
                          dispatch({
                            type: "REQUEST_NEW_DM",
                            payload: hit.email,
                          });
                        }}
                        key={index}
                      >
                        <p className="name">{hit.name}</p>
                        <p className="email">{hit.email}</p>
                      </div>
                    );
                  })}
                </Hits>
              ) : (
                ""
              )
            ) : (
              ""
            )}
          </Search>
          <animated.div style={friendsBarStyles}>
            <ScrollMenuWrapper>
              <ScrollMenu
                inertiaScrolling
                inertiaScrollingSlowdown={1}
                data={list}
              ></ScrollMenu>
            </ScrollMenuWrapper>
          </animated.div>
        </MenuBar>
      </Container>
    </Header>
  );
}

export default FeedHeader;
