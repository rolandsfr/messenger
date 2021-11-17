import { useState } from "react";
import "./main.scss";
import firebase from "./firebase";
import "firebase/auth";
import { useSelector, useDispatch } from "react-redux";
import {
  BrowserRouter as Router,
  Link,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";

import { login, logout } from "./redux/userReducer";
import Feed from "./components/Feed/Feed";
import Home from "./Home/Home";

import "./reset.scss";
import "./main.scss";

import SignIn from "./components/auth/SignIn";
import SignUp from "./components/auth/SignUp";
import DM from "./components/DM/DM";
import Profile from "./components/Profile/Profile";
import Preloader from "./components/Preloader/Preloader";

const db = firebase.firestore();
const auth = firebase.auth();

const friendsRef = db.collection("friends");

function App() {
  const { isLoggedIn } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(true);

  const dispatch = useDispatch();

  auth.onAuthStateChanged((user) => {
    if (user) dispatch(login());
    else dispatch(logout());

    setLoading(false);
  });

  return (
    <div>
      <Router>
        <Preloader loading={loading} />
        <Switch>
          <Route exact path="/profile" component={Profile} />

          {isLoggedIn ? (
            <>
              <Redirect to="/feed" push />
              <Route exact path="/feed" component={Feed} />
              <Route exact path="/feed/:id" component={DM} />
            </>
          ) : (
            <>
              <Redirect to="/home" />
              <Route path="/home" component={Home} />
              <Route exact path="/signin" component={SignIn} />
              <Route exact path="/signup" component={SignUp} />
            </>
          )}

          <Route exact path="/feed" component={Feed} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
